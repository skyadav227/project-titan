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

Evaluate the candidate's answer and return structured JSON feedback.

RULES:
- Evaluate ONLY what the candidate actually said — never invent information
- Score dimensions relevant to the question; use null for inapplicable ones
- Be honest and specific — not generic
- Return ONLY valid JSON — no markdown, no text outside the JSON

CLASSIFICATION: correct | mostly_correct | partially_correct | incorrect | insufficient | off_topic
SCORES: 0–100 (null = not applicable)

REQUIRED OUTPUT (return all fields):
{"overallScore":<0-100>,"technicalAccuracy":<0-100|null>,"relevance":<0-100>,"communication":<0-100>,"clarity":<0-100>,"structure":<0-100>,"completeness":<0-100>,"problemSolving":<0-100|null>,"classification":"<value>","strengths":["<str>"],"weaknesses":["<str>"],"missingPoints":["<str>"],"suggestions":["<str>"],"retryRecommended":<bool>,"explanationRecommended":<bool>,"technicalFeedback":{"correctness":"<str>","missingConcepts":[],"misconceptions":[],"improvedExplanation":"<str>"},"communicationFeedback":{"observations":[],"suggestions":[]}}`;

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
  lines.push("Return ONLY valid JSON. No markdown.");

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

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  // Extract embedded JSON object — handles text-before/after patterns from free models
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // The free-tier model frequently truncates its output mid-JSON
    // (finish_reason: "length"). Attempt to repair by finding the last
    // position where the JSON was still structurally valid — i.e. scan
    // backwards from the end to find the last complete top-level "}" and
    // try parsing the substring up to that point.
    parsed = _tryRepairTruncatedJson(cleaned);
    if (!parsed) {
      const err = new Error("AI returned invalid JSON for answer evaluation.");
      err.code = "AI_INVALID_JSON";
      throw err;
    }
    console.warn("[parseEvaluationResponse] Recovered from truncated JSON — partial fields will be filled with defaults.");
  }

  // Required field check — if overallScore is missing but we have a JSON object,
  // try to derive it from available scores rather than hard-fail
  if (typeof parsed.overallScore !== "number") {
    // Attempt to derive from average of present score fields
    const scoreFields = ["technicalAccuracy","relevance","communication","clarity","structure","completeness"];
    const presentScores = scoreFields.map(f => parsed[f]).filter(v => typeof v === "number");
    if (presentScores.length > 0) {
      parsed.overallScore = Math.round(presentScores.reduce((a, b) => a + b, 0) / presentScores.length);
      console.warn("[parseEvaluationResponse] Derived overallScore from field average:", parsed.overallScore);
    } else {
      const err = new Error("AI evaluation missing required overallScore.");
      err.code = "AI_SCHEMA_MISMATCH";
      throw err;
    }
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

  // ── Minimum completeness check after repair ──────────────────────────────
  // A truncated response can produce a valid-but-hollow evaluation: correct
  // overallScore and classification, but all feedback arrays empty and
  // technicalFeedback.correctness empty. This is not a fabricated score, but
  // it IS a meaningless evaluation the user cannot act on.
  //
  // Require at least one of the following to contain substantive content:
  //   • a non-empty strengths/weaknesses/missingPoints/suggestions array
  //   • a non-empty technicalFeedback.correctness string
  //
  // If none are present the response was truncated too early. Throw
  // AI_SCHEMA_MISMATCH so the bounded retry runs rather than accepting a
  // score-only shell as a completed evaluation.
  //
  // This check runs AFTER normalization so that the default-filling above
  // has already applied — we are testing for post-normalization emptiness.
  const hasTextualFeedback = (
    (Array.isArray(parsed.strengths)     && parsed.strengths.length     > 0) ||
    (Array.isArray(parsed.weaknesses)    && parsed.weaknesses.length    > 0) ||
    (Array.isArray(parsed.missingPoints) && parsed.missingPoints.length > 0) ||
    (Array.isArray(parsed.suggestions)   && parsed.suggestions.length   > 0) ||
    (typeof parsed.technicalFeedback?.correctness === "string" &&
     parsed.technicalFeedback.correctness.trim().length > 0)
  );

  if (!hasTextualFeedback) {
    const err = new Error("AI evaluation is incomplete: scores present but no feedback text. Retrying may produce a complete response.");
    err.code = "AI_SCHEMA_MISMATCH";
    throw err;
  }

  return parsed;
}

/**
 * Attempt to repair a truncated JSON string by scanning backwards for the
 * last syntactically valid JSON object.
 *
 * Free-tier models frequently return finish_reason:"length" which cuts off
 * the JSON mid-way. This tries to salvage the fields that were emitted before
 * truncation so the caller can still derive a partial evaluation rather than
 * discarding everything.
 *
 * Returns null if no valid object could be recovered.
 *
 * @param {string} s - Potentially truncated JSON string
 * @returns {object|null}
 */
function _tryRepairTruncatedJson(s) {
  if (!s || typeof s !== "string") return null;
  // Walk backwards through the string, trying each position where "}" appears
  // as a potential end-of-object marker.
  let pos = s.lastIndexOf("}");
  while (pos > 0) {
    const candidate = s.slice(0, pos + 1);
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch { /* not valid at this boundary, keep scanning */ }
    pos = s.lastIndexOf("}", pos - 1);
  }
  return null;
}

module.exports = { buildEvaluationPrompt, parseEvaluationResponse };
