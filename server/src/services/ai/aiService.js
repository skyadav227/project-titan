/**
 * aiService.js
 *
 * Application-level AI interface.
 * The rest of the application calls this — never the provider directly.
 * Selecting a different provider means changing this file only.
 *
 * Per the spec and interview-architecture.md §34:
 *   Controller → Interview Service → AI Service → Provider Adapter → AI Provider
 */
"use strict";

const { AI_PROVIDER, AI_MAX_RETRIES, AI_TIMEOUT_MS, AI_EVAL_MODELS } = require("../../config/env");
const { buildResumeAnalysisPrompt } = require("./prompts/resume/analyzeResume");
const { buildQuestionGenerationPrompt, parseQuestionGenerationResponse } = require("./prompts/interview/question/generateQuestion");
const { buildEvaluationPrompt, parseEvaluationResponse } = require("./prompts/interview/evaluation/evaluateAnswer");
const { buildExplanationPrompt, parseExplanationResponse } = require("./prompts/interview/explanation/generateExplanation");
const { buildFinalReportPrompt, parseFinalReportResponse } = require("./prompts/interview/finalReport/generateFinalReport");

// Load the configured provider adapter
function getAdapter() {
  if (AI_PROVIDER === "openrouter") {
    return require("./providers/openRouterAdapter");
  }
  throw new Error(`Unknown AI_PROVIDER: "${AI_PROVIDER}". Check your .env file.`);
}

/**
 * Retry wrapper for transient AI failures.
 * Bounded retries — never infinite loops.
 * Per interview-api.md §60, interview-architecture.md §92.
 *
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxRetries = AI_MAX_RETRIES) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // AI_SCHEMA_MISMATCH is included: the model occasionally returns a response
      // that parses as valid JSON but is missing required keys (e.g. a refusal or
      // partial output). This is transient — a retry with the same prompt almost
      // always succeeds. Without this, one bad response = total failure.
      // AI_RATE_LIMIT is explicitly excluded: HTTP 429 means the free-tier daily
      // quota is exhausted. Retrying immediately would waste the remaining quota
      // and loop. The frontend handles 429 as a non-retryable failure.
      // AI_REASONING_OVERFLOW is explicitly excluded: the reasoning model consumed
      // its entire token budget on internal chain-of-thought and produced no
      // final content. Retrying the identical request will reproduce the same
      // overflow — it is not a transient error and does not benefit from retry.
      const retryable = ["AI_NETWORK_ERROR", "AI_PROVIDER_ERROR", "AI_EMPTY_RESPONSE", "AI_INVALID_JSON", "AI_SCHEMA_MISMATCH"].includes(err.code);
      if (!retryable || attempt === maxRetries) break;
      const delay = 1000 * attempt; // simple backoff
      await new Promise(r => setTimeout(r, delay));
      console.warn(`[aiService] Retry ${attempt}/${maxRetries} after error: ${err.code}`);
    }
  }
  throw lastErr;
}

// ── Per-evaluation model fallback ─────────────────────────────────────────────

const MAX_TRANSIENT_RETRIES = 1;
// Hard ceiling on total HTTP requests = deduplicated model count × (1 + MAX_TRANSIENT_RETRIES)

const ABORT_ALL    = new Set(["AI_CONFIG_ERROR", "AI_AUTH_ERROR"]);
const SKIP_TO_NEXT = new Set(["AI_REASONING_OVERFLOW", "AI_EMPTY_RESPONSE", "AI_RATE_LIMIT",
                               "AI_PROVIDER_ERROR", "AI_INVALID_JSON", "AI_SCHEMA_MISMATCH"]);
const TRANSIENT    = new Set(["AI_NETWORK_ERROR"]);

/**
 * Try each model in `modelList` in order. For each model:
 *   - ABORT_ALL errors stop everything immediately.
 *   - SKIP_TO_NEXT errors advance immediately to the next model.
 *   - TRANSIENT errors retry the same model once (500 ms delay) then advance.
 *   - Unknown error codes advance without retry.
 * Returns the first successful result. Throws the last error if all models fail.
 * Maximum requests = modelList.length × 2 (after deduplication).
 *
 * @param {(model: string) => Promise<any>} operationFn - Called with one model ID
 * @param {string[]} modelList - Ordered list of model IDs to try
 * @returns {Promise<any>}
 */
async function withEvalModelFallback(operationFn, modelList) {
  // Runtime deduplication (preserves order)
  const seen   = new Set();
  const models = modelList.filter(m => !seen.has(m) && seen.add(m));

  if (models.length === 0) {
    const err = new Error(
      "withEvalModelFallback: model list is empty after deduplication. " +
      "Check AI_EVAL_MODELS configuration."
    );
    err.code = "AI_CONFIG_ERROR";
    throw err;
  }

  let lastErr;

  for (const model of models) {
    let transientAttempts = 0;

    while (transientAttempts <= MAX_TRANSIENT_RETRIES) {
      try {
        return await operationFn(model);
      } catch (err) {
        lastErr = err;

        if (ABORT_ALL.has(err.code)) throw err;

        if (SKIP_TO_NEXT.has(err.code)) {
          console.warn(`[aiService] ${model} → ${err.code}, trying next model`);
          break;
        }

        if (TRANSIENT.has(err.code)) {
          if (transientAttempts < MAX_TRANSIENT_RETRIES) {
            transientAttempts++;
            console.warn(`[aiService] ${model} → ${err.code} transient, retry ${transientAttempts}`);
            await new Promise(r => setTimeout(r, 500));
            continue;
          }
          console.warn(`[aiService] ${model} → ${err.code} transient limit reached, trying next model`);
          break;
        }

        // Unknown error code — advance without retry
        console.warn(`[aiService] ${model} → unknown code ${err.code || "(none)"}, trying next model`);
        break;
      }
    }
  }

  throw lastErr;
}

/**
 * Analyse a resume and return a structured candidate profile.
 *
 * @param {string} rawText         - Extracted resume text
 * @param {object} partialProfile  - Pre-parsed fields from parsingService
 * @returns {Promise<object>}      - Validated candidateProfile JSON
 * @throws {Error} With a user-safe message on failure
 */
async function analyzeResume(rawText, partialProfile) {
  const adapter = getAdapter();
  const { systemPrompt, userPrompt } = buildResumeAnalysisPrompt(rawText, partialProfile);

  const raw = await adapter.generate(systemPrompt, userPrompt, {
    maxTokens:   4096,
    temperature: 0.1,
  });

  return parseAndValidateAiOutput(raw);
}

/**
 * Parse the raw AI response string into a validated JSON object.
 * Malformed or incomplete AI responses must result in controlled failure.
 *
 * @param {string} raw
 * @returns {object}
 */
function parseAndValidateAiOutput(raw) {
  // Strip markdown code fences if the model included them despite instructions
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[aiService] AI output is not valid JSON. Raw (first 500):", raw.slice(0, 500));
    const err = new Error("We couldn't finish analyzing your resume. Please try again.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  // Minimal structural validation — ensure top-level keys exist
  const required = ["personal", "skills", "experience", "education", "projects"];
  for (const key of required) {
    if (!(key in parsed)) {
      console.error(`[aiService] AI output missing required key: ${key}`);
      const err = new Error("We couldn't finish analyzing your resume. Please try again.");
      err.code = "AI_SCHEMA_MISMATCH";
      throw err;
    }
  }

  // Normalise arrays — guard against the model returning null instead of []
  const arrayFields = ["experience", "education", "projects", "certifications", "achievements"];
  for (const f of arrayFields) {
    if (!Array.isArray(parsed[f])) parsed[f] = [];
  }

  const skillGroups = ["languages", "frontend", "backend", "databases", "tools", "other"];
  if (parsed.skills && typeof parsed.skills === "object") {
    for (const g of skillGroups) {
      if (!Array.isArray(parsed.skills[g])) parsed.skills[g] = [];
    }
  } else {
    parsed.skills = { languages: [], frontend: [], backend: [], databases: [], tools: [], other: [] };
  }

  // Normalise careerPreferences
  if (!parsed.careerPreferences || typeof parsed.careerPreferences !== "object") {
    parsed.careerPreferences = {
      targetRole:      { value: "", source: "ai_inferred" },
      experienceLevel: { value: "", source: "ai_inferred" },
    };
  }

  return parsed;
}

// ── Interview Intelligence AI methods ─────────────────────────────────────────

/**
 * Generate the next interview question.
 *
 * @param {object} ctx - Question generation context
 * @returns {Promise<object>} Validated question generation result
 */
async function generateQuestion(ctx) {
  const adapter = getAdapter();
  const { systemPrompt, userPrompt } = buildQuestionGenerationPrompt(ctx);

  return withRetry(async () => {
    const raw = await adapter.generate(systemPrompt, userPrompt, {
      maxTokens:   800,
      temperature: 0.7, // variability for question diversity
    });
    return parseQuestionGenerationResponse(raw);
  });
}

/**
 * Evaluate a candidate's answer.
 *
 * @param {object} ctx - Evaluation context
 * @returns {Promise<object>} Validated evaluation result
 */
async function evaluateAnswer(ctx) {
  const adapter = getAdapter();
  const { systemPrompt, userPrompt } = buildEvaluationPrompt(ctx);

  if (AI_EVAL_MODELS.length > 0) {
    return withEvalModelFallback(async (model) => {
      const raw = await adapter.generate(systemPrompt, userPrompt, {
        maxTokens: 2000, temperature: 0.1, model,
      });
      return parseEvaluationResponse(raw);
    }, AI_EVAL_MODELS);
  }

  // AI_EVAL_MODELS not configured — existing behavior unchanged
  return withRetry(async () => {
    const raw = await adapter.generate(systemPrompt, userPrompt, {
      maxTokens:   2000,
      temperature: 0.1,
    });
    return parseEvaluationResponse(raw);
  });
}

/**
 * Generate a contextual concept explanation.
 *
 * @param {object} ctx - Explanation context
 * @returns {Promise<object>} Validated explanation result
 */
async function generateExplanation(ctx) {
  const adapter = getAdapter();
  const { systemPrompt, userPrompt } = buildExplanationPrompt(ctx);

  return withRetry(async () => {
    const raw = await adapter.generate(systemPrompt, userPrompt, {
      maxTokens:   1000,
      temperature: 0.3,
    });
    return parseExplanationResponse(raw);
  });
}

/**
 * Synthesize the final interview master report.
 *
 * @param {object} ctx - Aggregated session evidence
 * @returns {Promise<object>} Validated final report synthesis
 */
async function generateFinalReport(ctx) {
  const adapter = getAdapter();
  const { systemPrompt, userPrompt } = buildFinalReportPrompt(ctx);

  return withRetry(async () => {
    const raw = await adapter.generate(systemPrompt, userPrompt, {
      maxTokens:   2000,
      temperature: 0.2,
    });
    return parseFinalReportResponse(raw);
  });
}

module.exports = {
  analyzeResume, generateQuestion, evaluateAnswer,
  generateExplanation, generateFinalReport,
  withEvalModelFallback,  // exported for deterministic tests only
};
