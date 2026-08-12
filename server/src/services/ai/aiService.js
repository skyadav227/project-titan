/**
 * aiService.js
 *
 * Application-level AI interface.
 * The rest of the application calls this — never the provider directly.
 * Selecting a different provider means changing this file only.
 *
 * Per the spec: "The rest of the application should request AI functionality
 * through the internal AI service rather than directly calling OpenRouter."
 */
"use strict";

const { AI_PROVIDER } = require("../../config/env");
const { buildResumeAnalysisPrompt } = require("./prompts/resume/analyzeResume");

// Load the configured provider adapter
function getAdapter() {
  if (AI_PROVIDER === "openrouter") {
    return require("./providers/openRouterAdapter");
  }
  throw new Error(`Unknown AI_PROVIDER: "${AI_PROVIDER}". Check your .env file.`);
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

module.exports = { analyzeResume };
