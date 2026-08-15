/**
 * evaluateAnswer.js
 *
 * Prompt builder for AI answer evaluation.
 *
 * AI evaluates SEMANTIC quality (correctness, depth, relevance, structure).
 * Deterministic metrics (word count, filler rate, duration) are calculated
 * separately by the speech analysis layer — never by AI.
 *
 * Per interview-api.md §30–32, interview-backend-spec.md §29–31.
 */
"use strict";

/**
 * Build prompts for answer evaluation.
 *
 * @param {object} ctx
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildEvaluationPrompt(ctx) {
  const { question, transcript, speechMetrics, interviewContext, candidateContext } = ctx;

  const systemPrompt = `You are an expert interview evaluator for TITAN, an AI interview training platform.

Your task is to evaluate a candidate's interview answer objectively and return structured feedback.

CRITICAL RULES:
- Evaluate ONLY what the candidate actually said — never invent or assume additional knowledge
- Score dimensions that are relevant to the question type — omit irrelevant ones (use null)
- Be honest: do not inflate scores; do not be unnecessarily harsh
- Feedback must be specific and actionable — not generic
- Never claim to measure psychological states (confidence, anxiety, nervousness)
- Return ONLY valid JSON matching the schema — no markdown, no explanation

CLASSIFICATION GUIDE:
- correct: core answer is accurate and complete
- mostly_correct: core correct but missing 1–2 important details
- partially_correct: some important info correct, but significant gaps or misconceptions
- incorrect: central concept or conclusion is wrong
- insufficient: not enough information to evaluate meaningfully
- off_topic: answer does not address the question

SCORE SCALE: 0–100 (null = dimension not applicable to this question type)

OUTPUT SCHEMA (strict JSON):
{
  "overallScore": <0-100>,
  "technicalAccuracy": <0-100 or null>,
  "relevance": <0-100>,
  "communication": <0-100>,
  "clarity": <0-100>,
  "structure": <0-100>,
  "completeness": <0-100>,
  "problemSolving": <0-100 or null>,
  "classification": "<correct|mostly_correct|partially_correct|incorrect|insufficient|off_topic>",
  "strengths": ["<specific strength>"],
  "weaknesses": ["<specific weakness>"],
  "missingPoints": ["<important concept not mentioned>"],
  "suggestions": ["<actionable improvement>"],
  "technicalFeedback": {
    "correctness": "<brief assessment of technical accuracy>",
    "missingConcepts": ["<concept>"],
    "misconceptions": ["<misconception if any>"],
    "improvedExplanation": "<how a strong answer would approach this>"
  },
  "communicationFeedback": {
    "observations": ["<observable communication pattern>"],
    "suggestions": ["<actionable communication improvement>"]
  },
  "retryRecommended": <true|false>,
  "explanationRecommended": <true|false>
}`;

  const lines = [];

  lines.push("=== INTERVIEW CONTEXT ===");
  lines.push(`Interview Type: ${interviewContext.interviewType || "mixed"}`);
  if (interviewContext.role) lines.push(`Target Role: ${interviewContext.role}`);
  if (candidateContext?.experienceLevel) lines.push(`Experience Level: ${candidateContext.experienceLevel}`);

  lines.push("\n=== QUESTION ===");
  lines.push(`Category: ${question.category}`);
  lines.push(`Difficulty: ${question.difficulty}`);
  lines.push(`Topic: ${question.topic || question.category}`);
  lines.push(`Question: "${question.text}"`);

  lines.push("\n=== CANDIDATE'S ANSWER ===");
  const transcriptText = transcript?.text?.trim() || "";
  if (transcriptText) {
    lines.push(`Transcript: "${transcriptText}"`);
  } else {
    lines.push("Transcript: [No transcript available — answer may be insufficient]");
  }

  // Include deterministic speech metrics as context for communication evaluation
  // AI uses these to calibrate communication score — never fabricates them
  if (speechMetrics) {
    lines.push("\n=== SPEECH METRICS (deterministically calculated) ===");
    if (speechMetrics.wordCount !== null) lines.push(`Word Count: ${speechMetrics.wordCount}`);
    if (speechMetrics.responseDurationMs !== null) lines.push(`Duration: ${Math.round(speechMetrics.responseDurationMs / 1000)}s`);
    if (speechMetrics.fillerWordCount !== null) lines.push(`Filler Words: ${speechMetrics.fillerWordCount}`);
    if (speechMetrics.speakingRate !== null) lines.push(`Speaking Rate: ${speechMetrics.speakingRate} wpm`);
  }

  lines.push("\n=== YOUR TASK ===");
  lines.push("Evaluate the candidate's answer against the question. Be specific about what was said.");
  lines.push("Set retryRecommended=true if the answer shows a meaningful improvement opportunity.");
  lines.push("Set explanationRecommended=true if there is a significant knowledge gap worth addressing.");
  lines.push("Return ONLY valid JSON. No markdown. No explanation.");

  return {
    systemPrompt,
    userPrompt: lines.join("\n"),
  };
}

/**
 * Validate and normalize the AI evaluation response.
 *
 * @param {string} raw
 * @returns {object} Validated evaluation
 */
function parseEvaluationResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error("AI returned invalid JSON for answer evaluation.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  // Required field check
  if (typeof parsed.overallScore !== "number") {
    const err = new Error("AI evaluation missing required overallScore.");
    err.code = "AI_SCHEMA_MISMATCH";
    throw err;
  }

  // Normalize scores to valid range
  const scoreFields = ["overallScore","technicalAccuracy","relevance","communication","clarity","structure","completeness","problemSolving"];
  for (const f of scoreFields) {
    if (parsed[f] !== null && parsed[f] !== undefined) {
      parsed[f] = Math.max(0, Math.min(100, Math.round(parsed[f])));
    }
  }

  // Normalize classification
  const validClassifications = new Set(["correct","mostly_correct","partially_correct","incorrect","insufficient","off_topic"]);
  if (!validClassifications.has(parsed.classification)) {
    // Derive from score if invalid
    const s = parsed.overallScore;
    parsed.classification = s >= 85 ? "correct" : s >= 70 ? "mostly_correct" : s >= 50 ? "partially_correct" : s >= 30 ? "incorrect" : "insufficient";
  }

  // Ensure arrays exist
  for (const f of ["strengths","weaknesses","missingPoints","suggestions"]) {
    if (!Array.isArray(parsed[f])) parsed[f] = [];
  }

  // Ensure feedback objects
  if (!parsed.technicalFeedback || typeof parsed.technicalFeedback !== "object") {
    parsed.technicalFeedback = { correctness: "", missingConcepts: [], misconceptions: [], improvedExplanation: "" };
  }
  if (!Array.isArray(parsed.technicalFeedback.missingConcepts)) parsed.technicalFeedback.missingConcepts = [];
  if (!Array.isArray(parsed.technicalFeedback.misconceptions)) parsed.technicalFeedback.misconceptions = [];

  if (!parsed.communicationFeedback || typeof parsed.communicationFeedback !== "object") {
    parsed.communicationFeedback = { observations: [], suggestions: [] };
  }
  if (!Array.isArray(parsed.communicationFeedback.observations)) parsed.communicationFeedback.observations = [];
  if (!Array.isArray(parsed.communicationFeedback.suggestions)) parsed.communicationFeedback.suggestions = [];

  // Ensure booleans
  parsed.retryRecommended       = Boolean(parsed.retryRecommended);
  parsed.explanationRecommended = Boolean(parsed.explanationRecommended);

  return parsed;
}

module.exports = { buildEvaluationPrompt, parseEvaluationResponse };
