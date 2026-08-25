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

  // ── Derive human-readable difficulty guidance ─────────────────────────────
  const difficultyGuidance = _buildDifficultyGuidance(strategyContext.currentDifficulty);

  // ── Derive interview-type guidance ────────────────────────────────────────
  const typeGuidance = _buildTypeGuidance(
    interviewContext.interviewType,
    interviewContext.role
  );

  // ── Derive stage guidance ─────────────────────────────────────────────────
  const stageGuidance = _buildStageGuidance(
    strategyContext.interviewStage,
    isFirstQuestion
  );

  const systemPrompt = `You are an expert professional interviewer for TITAN, an AI interview training platform. Generate ONE focused, relevant interview question.

RULES:
- Exactly ONE question per response
- Use only information provided — never invent candidate experience
- Return ONLY valid JSON — no markdown, no prose around it

DIFFICULTY: ${difficultyGuidance}
TYPE: ${typeGuidance}
STAGE: ${stageGuidance}

OUTPUT SCHEMA:
{"action":"question","question":{"text":"<question>","category":"<technical|behavioral|project|resume|role|follow_up|system_design|problem_solving|scenario|conceptual>","topic":"<brief label>","difficulty":"<easy|medium|hard>","type":"<initial|follow_up|clarification|weak_area|strength_probe|topic_transition>","expectedDurationSeconds":<60-180>},"reason":"<opening|follow_up|clarification|weak_area|strength_probe|difficulty_increase|difficulty_decrease|topic_transition|explanation_follow_up>"}`;

  // Build context section for the user prompt
  const lines = [];

  // Interview parameters
  lines.push("=== INTERVIEW PARAMETERS ===");
  lines.push(`Interview Type: ${interviewContext.interviewType || "mixed"}`);
  lines.push(`Difficulty: ${strategyContext.currentDifficulty}`);
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
  if (strategyContext.weakTopics?.length) lines.push(`Weak Areas (address if appropriate): ${strategyContext.weakTopics.join(", ")}`);
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
    lines.push(_buildOpeningInstruction(interviewContext.interviewType, interviewContext.role, candidateContext));
  } else if (isFollowUp) {
    lines.push("Generate a contextual follow-up question based on the candidate's last answer. Probe the weak areas or interesting points they mentioned. Stay within the interview type and difficulty guidelines above.");
  } else {
    lines.push("Generate the next most valuable interview question following the interview type and difficulty guidelines above. Avoid repeating covered topics. Address weak areas if appropriate.");
  }
  lines.push("Return ONLY valid JSON. No markdown. No explanation.");

  return {
    systemPrompt,
    userPrompt: lines.join("\n"),
  };
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Compact difficulty directive — one line, not a paragraph.
 */
function _buildDifficultyGuidance(difficulty) {
  switch ((difficulty || "medium").toLowerCase()) {
    case "easy":   return "EASY — fundamental concepts for beginners/juniors. No complex architecture, trade-offs, or senior-level design.";
    case "hard":   return "HARD — advanced concepts, architecture, edge cases, deep trade-offs for experienced candidates.";
    default:       return "MEDIUM — practical working knowledge, real-world implementation, moderate complexity.";
  }
}

/**
 * Compact type directive — one or two lines.
 */
function _buildTypeGuidance(interviewType, role) {
  switch ((interviewType || "mixed").toLowerCase()) {
    case "technical":    return "TECHNICAL — test technical knowledge, implementation, concepts, debugging, architecture. No behavioral questions.";
    case "behavioral":   return "BEHAVIORAL — ask about past experiences, teamwork, conflict, leadership, decisions. Use STAR framing where natural. No technical deep-dives.";
    case "role_specific":return `ROLE-SPECIFIC for ${role || "the target role"} — questions directly relevant to the responsibilities and practical scenarios of this role. Draw on candidate's background.`;
    default:             return "MIXED — alternate between technical and behavioral. Balance both types; do not skew to one.";
  }
}

/**
 * Compact stage directive — one line.
 */
function _buildStageGuidance(stage, isFirstQuestion) {
  if (isFirstQuestion || stage === "opening") {
    return "OPENING — ask a warm introduction/background question so the candidate can introduce themselves. Do not jump into technical content immediately.";
  }
  if (stage === "closing") {
    return "CLOSING — ask a reflective or wrap-up question appropriate to the interview type.";
  }
  return "CORE — ask substantive questions matching the type and difficulty. Probe weak areas, maintain topic diversity.";
}

/**
 * Build the opening question task instruction.
 */
function _buildOpeningInstruction(interviewType, role, candidateContext) {
  const roleLabel = role ? `the ${role} role` : "this role";
  const expLevel  = candidateContext?.experienceLevel || "";
  const levelHint = expLevel ? ` (candidate level: ${expLevel})` : "";

  if ((interviewType || "").toLowerCase() === "behavioral") {
    return `Generate an opening introduction question for a behavioral interview${levelHint}. Ask the candidate to introduce themselves and describe their professional background relevant to ${roleLabel}. Generate a natural, welcoming version.`;
  }

  return `Generate an opening introduction question${levelHint}. Ask the candidate to introduce themselves and summarize their background, skills, or experience most relevant to ${roleLabel}. Keep it welcoming — this sets the tone for the rest of the interview.`;
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

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }

  // Some models wrap response in text before/after JSON — extract the JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Last resort: try to extract a question text directly from the raw response
    // if the model returned plain text instead of JSON
    const rawTrimmed = raw.trim();
    if (rawTrimmed.length > 10 && rawTrimmed.length < 2000) {
      console.warn("[generateQuestion] AI returned non-JSON, treating as plain text question");
      return {
        action: "question",
        question: {
          text: rawTrimmed.slice(0, 500),
          category: "technical",
          topic: "general",
          difficulty: "medium",
          type: "initial",
          expectedDurationSeconds: 120,
        },
        reason: "opening",
      };
    }
    const err = new Error("AI returned invalid JSON for question generation.");
    err.code = "AI_INVALID_JSON";
    throw err;
  }

  // Schema validation
  const validActions = new Set(["question", "complete"]);
  if (!parsed.action || !validActions.has(parsed.action)) {
    // If the model returned a question object at top level without "action" wrapper
    if (parsed.question?.text || parsed.text) {
      console.warn("[generateQuestion] AI returned question without action wrapper — normalizing");
      return {
        action: "question",
        question: {
          text: (parsed.question?.text || parsed.text || "").trim(),
          category: parsed.question?.category || parsed.category || "technical",
          topic: parsed.question?.topic || parsed.topic || "general",
          difficulty: parsed.question?.difficulty || parsed.difficulty || "medium",
          type: parsed.question?.type || "initial",
          expectedDurationSeconds: 120,
        },
        reason: parsed.reason || "opening",
      };
    }
    if (typeof parsed === "string" && parsed.trim().length > 5) {
      return {
        action: "question",
        question: { text: parsed.trim(), category: "technical", topic: "general", difficulty: "medium", type: "initial", expectedDurationSeconds: 120 },
        reason: "opening",
      };
    }
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
