/**
 * generateQuestion.js
 *
 * Prompt builder for adaptive interview question generation.
 *
 * The prompt receives a compact, normalized context — NOT raw DB documents.
 * Only what the model needs is included to minimize token usage and prevent
 * accidental information leakage.
 *
 * AI output must be schema-validated before persistence.
 * The `reason` field is internal and must never be exposed to the frontend.
 *
 * Per interview-api.md §42–44, interview-backend-spec.md §13–14.
 */
"use strict";

/**
 * Build prompts for next interview question generation.
 *
 * @param {object} ctx - Structured question generation context
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildQuestionGenerationPrompt(ctx) {
  const {
    interviewContext,
    candidateContext,
    strategyContext,
    previousQuestions = [],
    currentAnswer     = null,
    currentEvaluation = null,
    isFollowUp        = false,
    isFirstQuestion   = false,
  } = ctx;

  const systemPrompt = `You are an expert technical interviewer conducting a professional interview for TITAN, an AI interview training platform.

Your role is to generate ONE focused, contextually relevant interview question.

CRITICAL RULES:
- Generate exactly ONE question — never multiple questions
- Base questions ONLY on information provided in the context — never invent candidate experience
- The question must be appropriate for the candidate's experience level and interview stage
- Do not expose your reasoning to the candidate
- Return ONLY valid JSON matching the schema below — no markdown, no explanation, no wrapper text

OUTPUT SCHEMA (strict JSON):
{
  "action": "question",
  "question": {
    "text": "<the question text — clear, professional, focused>",
    "category": "<one of: technical|behavioral|project|resume|company|role|job_description|follow_up|system_design|problem_solving|scenario|conceptual>",
    "topic": "<brief topic label e.g. 'JWT authentication' or 'React state management'>",
    "difficulty": "<easy|medium|hard>",
    "type": "<initial|follow_up|clarification|weak_area|strength_probe|topic_transition>",
    "expectedDurationSeconds": <integer 60–180>
  },
  "reason": "<internal only — one of: opening|follow_up|clarification|weak_area|strength_probe|difficulty_increase|difficulty_decrease|topic_transition|explanation_follow_up>"
}`;

  // Build context section for the user prompt
  const lines = [];

  // Interview parameters
  lines.push("=== INTERVIEW PARAMETERS ===");
  lines.push(`Interview Type: ${interviewContext.interviewType || "mixed"}`);
  lines.push(`Difficulty Target: ${strategyContext.currentDifficulty}`);
  lines.push(`Stage: ${strategyContext.interviewStage}`);
  lines.push(`Questions Answered: ${strategyContext.questionsAnswered}`);
  lines.push(`Questions Remaining: ${strategyContext.questionsRemaining}`);

  // Candidate context
  lines.push("\n=== CANDIDATE CONTEXT ===");
  if (candidateContext?.name) lines.push(`Name: ${candidateContext.name}`);
  if (candidateContext?.experienceLevel) lines.push(`Experience Level: ${candidateContext.experienceLevel}`);
  if (interviewContext.company) lines.push(`Target Company: ${interviewContext.company}`);
  if (interviewContext.role) lines.push(`Target Role: ${interviewContext.role}`);

  // Resume context
  if (interviewContext.resumeContext) {
    const rc = interviewContext.resumeContext;
    lines.push("\n=== CANDIDATE RESUME CONTEXT ===");
    if (rc.candidateSummary) lines.push(`Summary: ${rc.candidateSummary}`);
    if (rc.primarySkills?.length) lines.push(`Key Skills: ${rc.primarySkills.join(", ")}`);
    if (rc.projects?.length) {
      lines.push("Notable Projects:");
      rc.projects.slice(0, 3).forEach(p => {
        lines.push(`  - ${p.name}: ${p.description || ""} [${(p.technologies || []).join(", ")}]`);
      });
    }
  }

  // Job description (trimmed to first 500 chars if too long)
  if (interviewContext.jobDescription) {
    const jd = interviewContext.jobDescription.slice(0, 500);
    lines.push("\n=== JOB DESCRIPTION (EXCERPT) ===");
    lines.push(jd);
  }

  // Strategy state
  lines.push("\n=== INTERVIEW STRATEGY ===");
  if (strategyContext.coveredTopics?.length) lines.push(`Already Covered: ${strategyContext.coveredTopics.join(", ")}`);
  if (strategyContext.weakTopics?.length) lines.push(`Weak Areas: ${strategyContext.weakTopics.join(", ")}`);
  if (strategyContext.strongTopics?.length) lines.push(`Strong Areas: ${strategyContext.strongTopics.join(", ")}`);
  if (strategyContext.recentScores?.length) {
    const avg = Math.round(strategyContext.recentScores.reduce((a, b) => a + b, 0) / strategyContext.recentScores.length);
    lines.push(`Recent Performance Avg: ${avg}/100`);
  }

  // Previous questions (last 3 for context)
  if (previousQuestions.length > 0) {
    lines.push("\n=== RECENT QUESTIONS ASKED ===");
    previousQuestions.slice(-3).forEach((q, i) => {
      lines.push(`Q${i + 1}: [${q.topic || q.category}] ${q.text}`);
    });
  }

  // Current answer and evaluation (for follow-up generation)
  if (isFollowUp && currentAnswer && currentEvaluation) {
    lines.push("\n=== CANDIDATE'S LAST ANSWER ===");
    lines.push(`Transcript: "${currentAnswer.transcript?.text?.slice(0, 400) || ""}"`);
    lines.push(`Score: ${currentEvaluation.overallScore ?? "N/A"}/100`);
    lines.push(`Classification: ${currentEvaluation.classification || "N/A"}`);
    if (currentEvaluation.technicalFeedback?.missingConcepts?.length) {
      lines.push(`Missing Concepts: ${currentEvaluation.technicalFeedback.missingConcepts.join(", ")}`);
    }
    if (currentEvaluation.weaknesses?.length) {
      lines.push(`Weaknesses: ${currentEvaluation.weaknesses.join("; ")}`);
    }
  }

  // Task instruction
  lines.push("\n=== YOUR TASK ===");
  if (isFirstQuestion) {
    lines.push("Generate an opening question appropriate to start this interview. For resume-based interviews, open with something relevant to the candidate's actual projects or experience.");
  } else if (isFollowUp) {
    lines.push("Generate a contextual follow-up question based on the candidate's last answer. Probe the weak areas or interesting points they mentioned.");
  } else {
    lines.push("Generate the next most valuable interview question. Avoid repeating covered topics. Address weak areas if appropriate.");
  }
  lines.push("Return ONLY valid JSON. No markdown. No explanation.");

  return {
    systemPrompt,
    userPrompt: lines.join("\n"),
  };
}

/**
 * Validate and normalize the AI question generation response.
 *
 * @param {string} raw - Raw string from AI provider
 * @returns {object} Validated question generation result
 * @throws {Error} With code AI_SCHEMA_MISMATCH if invalid
 */
function parseQuestionGenerationResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error("AI returned invalid JSON for question generation.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  // Schema validation
  const validActions = new Set(["question", "complete"]);
  if (!parsed.action || !validActions.has(parsed.action)) {
    const err = new Error("AI question response missing or invalid 'action' field.");
    err.code = "AI_SCHEMA_MISMATCH";
    throw err;
  }

  if (parsed.action === "question") {
    const q = parsed.question;
    if (!q || typeof q.text !== "string" || !q.text.trim()) {
      const err = new Error("AI question response missing question text.");
      err.code = "AI_SCHEMA_MISMATCH";
      throw err;
    }

    const validCategories = new Set(["technical","behavioral","project","resume","company","role","job_description","follow_up","mixed","system_design","problem_solving","scenario","conceptual"]);
    const validDifficulties = new Set(["easy", "medium", "hard"]);

    // Normalize / fallback invalid enum values rather than hard-fail
    if (!validCategories.has(q.category)) q.category = "technical";
    if (!validDifficulties.has(q.difficulty)) q.difficulty = "medium";
    if (!q.topic) q.topic = q.category;
    if (!q.type) q.type = "initial";
    if (!q.expectedDurationSeconds || typeof q.expectedDurationSeconds !== "number") {
      q.expectedDurationSeconds = 120;
    }

    // Trim question text
    q.text = q.text.trim();
  }

  return parsed;
}

module.exports = { buildQuestionGenerationPrompt, parseQuestionGenerationResponse };
