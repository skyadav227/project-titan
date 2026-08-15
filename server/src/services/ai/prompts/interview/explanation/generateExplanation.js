/**
 * generateExplanation.js
 *
 * Prompt builder for contextual concept explanations.
 *
 * Explanations are grounded in the current interview context.
 * They must NOT reveal the exact answer to the interview question —
 * they explain the underlying concept at a learning level appropriate
 * to the candidate's experience.
 *
 * Per interview-api.md §37–38, interview-backend-spec.md §40–41.
 */
"use strict";

/**
 * Build prompts for explanation generation.
 *
 * @param {object} ctx
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildExplanationPrompt(ctx) {
  const { topic, questionText, interviewContext, candidateContext } = ctx;

  const systemPrompt = `You are an expert technical educator helping a candidate understand a concept encountered during their interview with TITAN.

Your explanation must be:
- Concise (focused on what matters for an interview context)
- Technically accurate
- Appropriate to the candidate's experience level
- Grounded in the current interview topic
- NOT a full tutorial — focus on the specific concept

Do NOT:
- Reveal the exact answer the interviewer expects
- Provide a script for the candidate to memorize
- Fabricate candidate experience or assume knowledge not in context

Return ONLY valid JSON matching the schema — no markdown, no extra text.

OUTPUT SCHEMA (strict JSON):
{
  "topic": "<confirmed topic being explained>",
  "explanation": "<clear, concise explanation — 2–4 sentences>",
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "example": "<brief practical example if helpful, otherwise empty string>",
  "interviewTip": "<how to apply this knowledge in an interview answer>"
}`;

  const lines = [];

  lines.push("=== CONTEXT ===");
  if (candidateContext?.experienceLevel) lines.push(`Candidate Level: ${candidateContext.experienceLevel}`);
  if (interviewContext.role) lines.push(`Target Role: ${interviewContext.role}`);
  if (interviewContext.interviewType) lines.push(`Interview Type: ${interviewContext.interviewType}`);

  lines.push("\n=== INTERVIEW QUESTION ===");
  lines.push(`"${questionText}"`);

  lines.push("\n=== CONCEPT TO EXPLAIN ===");
  lines.push(`Topic: ${topic}`);

  lines.push("\n=== YOUR TASK ===");
  lines.push("Explain this concept clearly and concisely at the appropriate level.");
  lines.push("Focus on what the candidate needs to understand, not a full textbook treatment.");
  lines.push("Return ONLY valid JSON. No markdown.");

  return {
    systemPrompt,
    userPrompt: lines.join("\n"),
  };
}

/**
 * Validate and normalize the AI explanation response.
 *
 * @param {string} raw
 * @returns {object}
 */
function parseExplanationResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error("AI returned invalid JSON for explanation.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  if (typeof parsed.explanation !== "string" || !parsed.explanation.trim()) {
    const err = new Error("AI explanation missing explanation text.");
    err.code = "AI_SCHEMA_MISMATCH";
    throw err;
  }

  if (!Array.isArray(parsed.keyPoints)) parsed.keyPoints = [];
  if (typeof parsed.topic !== "string") parsed.topic = "";
  if (typeof parsed.example !== "string") parsed.example = "";
  if (typeof parsed.interviewTip !== "string") parsed.interviewTip = "";

  return parsed;
}

module.exports = { buildExplanationPrompt, parseExplanationResponse };
