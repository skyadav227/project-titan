/**
 * generateFinalReport.js
 *
 * Prompt builder for the final master report synthesis.
 *
 * The AI SYNTHESIZES from already-persisted evaluation evidence.
 * It does NOT invent scores or metrics — those come from stored data.
 * The AI provides qualitative analysis: trends, patterns, recommendations.
 *
 * Per interview-api.md §48–51, interview-backend-spec.md §45–46.
 */
"use strict";

/**
 * Build prompts for final report synthesis.
 *
 * @param {object} ctx
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildFinalReportPrompt(ctx) {
  const {
    session,
    questions,
    attemptSummaries,  // pre-aggregated from stored evaluations
    aggregatedScores,  // pre-calculated from stored data
    speechSummary,
    retryImprovements,
  } = ctx;

  const systemPrompt = `You are an expert career coach synthesizing a final interview performance report for TITAN.

CRITICAL RULES:
- Base ALL analysis on the provided evidence — never invent performance data
- Scores and metrics are already calculated — you provide qualitative synthesis only
- Recommendations must connect directly to observed weaknesses in the evidence
- Avoid generic advice like "practice more" — be specific
- Be honest but constructive — not discouraging

Return ONLY valid JSON matching the schema — no markdown, no extra text.

OUTPUT SCHEMA (strict JSON):
{
  "strengths": ["<specific observed strength — max 4>"],
  "improvements": ["<specific improvement area — max 4>"],
  "knowledgeGaps": ["<specific knowledge gap identified>"],
  "recommendations": ["<specific actionable recommendation — max 4>"],
  "technicalSummary": "<2–3 sentences on technical performance>",
  "communicationSummary": "<2–3 sentences on communication patterns>",
  "progressSummary": "<1–2 sentences on improvement during the session if any>",
  "nextSteps": ["<specific practice action — max 3>"]
}`;

  const lines = [];

  lines.push("=== SESSION OVERVIEW ===");
  lines.push(`Interview Type: ${session.configuration?.interviewType || "mixed"}`);
  if (session.configuration?.company) lines.push(`Target Company: ${session.configuration.company}`);
  if (session.configuration?.targetRole || session.interviewContextSnapshot?.targetRole) {
    lines.push(`Target Role: ${session.configuration.targetRole || session.interviewContextSnapshot.targetRole}`);
  }
  lines.push(`Questions Answered: ${aggregatedScores.questionsAnswered}`);
  lines.push(`Questions Retried: ${aggregatedScores.retryCount}`);
  lines.push(`Overall Score: ${aggregatedScores.overallScore}/100`);

  lines.push("\n=== AGGREGATED SCORES ===");
  const dims = aggregatedScores.dimensions || {};
  for (const [k, v] of Object.entries(dims)) {
    if (v !== null) lines.push(`  ${k}: ${v}/100`);
  }

  if (speechSummary) {
    lines.push("\n=== SPEECH SUMMARY ===");
    if (speechSummary.averageSpeakingRate !== null) lines.push(`Avg Speaking Rate: ${speechSummary.averageSpeakingRate} wpm`);
    if (speechSummary.totalFillerWords !== null) lines.push(`Total Filler Words: ${speechSummary.totalFillerWords}`);
  }

  lines.push("\n=== QUESTION PERFORMANCE ===");
  attemptSummaries.forEach((s, i) => {
    lines.push(`Q${i + 1} [${s.topic || s.category}] ${s.questionText?.slice(0, 80) || ""}`);
    lines.push(`  Best Score: ${s.bestScore ?? "N/A"} | Classification: ${s.classification || "N/A"} | Attempts: ${s.attempts}`);
    if (s.weaknesses?.length) lines.push(`  Weaknesses: ${s.weaknesses.join("; ")}`);
    if (s.missingPoints?.length) lines.push(`  Missing: ${s.missingPoints.join("; ")}`);
  });

  if (retryImprovements?.length) {
    lines.push("\n=== RETRY IMPROVEMENTS ===");
    retryImprovements.forEach(ri => {
      lines.push(`  Q${ri.questionNumber}: ${ri.previousScore} → ${ri.newScore} (+${ri.delta})`);
    });
  }

  lines.push("\n=== YOUR TASK ===");
  lines.push("Synthesize a qualitative performance summary based ONLY on the evidence above.");
  lines.push("Provide specific, actionable insights — not generic encouragement.");
  lines.push("Return ONLY valid JSON. No markdown.");

  return {
    systemPrompt,
    userPrompt: lines.join("\n"),
  };
}

/**
 * Validate and normalize the final report AI response.
 *
 * @param {string} raw
 * @returns {object}
 */
function parseFinalReportResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error("AI returned invalid JSON for final report.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  // Ensure arrays exist
  for (const f of ["strengths","improvements","knowledgeGaps","recommendations","nextSteps"]) {
    if (!Array.isArray(parsed[f])) parsed[f] = [];
  }

  // Ensure strings
  for (const f of ["technicalSummary","communicationSummary","progressSummary"]) {
    if (typeof parsed[f] !== "string") parsed[f] = "";
  }

  return parsed;
}

module.exports = { buildFinalReportPrompt, parseFinalReportResponse };
