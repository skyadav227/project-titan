/**
 * interviewService.js
 *
 * Frontend API wrapper for all Interview Intelligence endpoints.
 * Mirrors interview-api.md §71 endpoint table exactly.
 *
 * Pattern: identical to authService/resumeService — thin wrappers over apiFetch.
 * Never duplicates backend logic. Returns raw data from the API.
 */
import { apiFetch } from "./api";

// ── Session operations ────────────────────────────────────────────────────────

/**
 * Create a new interview session.
 * POST /api/interviews
 */
export function createInterview(config) {
  return apiFetch("/interviews", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

/**
 * Get a session by ID.
 * GET /api/interviews/:id
 */
export function getInterview(id) {
  return apiFetch(`/interviews/${id}`);
}

/**
 * Start an interview session — builds context, generates first question.
 * POST /api/interviews/:id/start
 */
export function startInterview(id) {
  return apiFetch(`/interviews/${id}/start`, { method: "POST" });
}

/**
 * Get the current unanswered question (used for session recovery).
 * GET /api/interviews/:id/current
 */
export function getCurrentQuestion(id) {
  return apiFetch(`/interviews/${id}/current`);
}

/**
 * Generate next interview action (question / complete).
 * POST /api/interviews/:id/next
 */
export function getNextAction(id) {
  return apiFetch(`/interviews/${id}/next`, { method: "POST" });
}

/**
 * End interview early.
 * POST /api/interviews/:id/end
 */
export function endInterview(id, reason = "user_ended") {
  return apiFetch(`/interviews/${id}/end`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ── Answer operations ─────────────────────────────────────────────────────────

/**
 * Submit a voice answer for a question.
 * POST /api/interviews/:id/questions/:questionId/answers
 *
 * Sends multipart/form-data with the audio blob + durationMs.
 * Optionally accepts an idempotency key header.
 */
export function submitAnswer(sessionId, questionId, { audioBlob, durationMs, idempotencyKey }) {
  const formData = new FormData();
  if (audioBlob) {
    formData.append("audio", audioBlob, "answer.webm");
  }
  if (durationMs !== null && durationMs !== undefined) {
    formData.append("durationMs", String(Math.round(durationMs)));
  }

  const headers = {};
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return apiFetch(`/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    body: formData,
    headers,
  });
}

/**
 * Submit a text answer for a question (bypasses STT; used for dev/integration testing).
 * POST /api/interviews/:id/questions/:questionId/answers
 *
 * Sends multipart/form-data with a `text` field instead of audio.
 * The backend uses the text directly as the transcript and routes it straight
 * to AI evaluation — no OpenAI Whisper key required.
 */
export function submitTextAnswer(sessionId, questionId, { text, idempotencyKey }) {
  const formData = new FormData();
  formData.append("text", text);

  const headers = {};
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return apiFetch(`/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    body: formData,
    headers,
  });
}

/**
 * Poll answer processing status.
 * GET /api/interviews/:id/answers/:answerAttemptId
 */
export function getAnswerStatus(sessionId, answerAttemptId) {
  return apiFetch(`/interviews/${sessionId}/answers/${answerAttemptId}`);
}

/**
 * Reevaluate a failed answer attempt using its saved transcript.
 * POST /api/interviews/:id/answers/:answerAttemptId/reevaluate
 *
 * Re-runs AI evaluation on the existing failed attempt without creating
 * a new AnswerAttempt document. Does not consume the user's deliberate
 * answer-retry quota.
 */
export function reevaluateAnswer(sessionId, attemptId) {
  return apiFetch(`/interviews/${sessionId}/answers/${attemptId}/reevaluate`, {
    method: "POST",
  });
}

/**
 * Request a retry for a question.
 * POST /api/interviews/:id/questions/:questionId/retry
 */
export function retryQuestion(sessionId, questionId) {
  return apiFetch(`/interviews/${sessionId}/questions/${questionId}/retry`, {
    method: "POST",
  });
}

// ── Explanation operations ────────────────────────────────────────────────────

/**
 * Request a contextual explanation.
 * POST /api/interviews/:id/explanations
 */
export function requestExplanation(sessionId, { questionId, topic }) {
  return apiFetch(`/interviews/${sessionId}/explanations`, {
    method: "POST",
    body: JSON.stringify({ questionId, topic }),
  });
}

/**
 * Continue after explanation — gets next action.
 * POST /api/interviews/:id/explanations/continue
 */
export function continueAfterExplanation(sessionId) {
  return apiFetch(`/interviews/${sessionId}/explanations/continue`, {
    method: "POST",
  });
}

// ── Report operations ─────────────────────────────────────────────────────────

/**
 * Trigger final report generation.
 * POST /api/interviews/:id/report
 */
export function generateReport(sessionId) {
  return apiFetch(`/interviews/${sessionId}/report`, { method: "POST" });
}

/**
 * Get final report (returns null if not generated yet).
 * GET /api/interviews/:id/report
 */
export function getReport(sessionId) {
  return apiFetch(`/interviews/${sessionId}/report`);
}

// ── History + Progress ────────────────────────────────────────────────────────

/**
 * Get paginated interview history.
 * GET /api/interviews
 */
export function getInterviewHistory({ page = 1, limit = 20, status, interviewType } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set("status", status);
  if (interviewType) params.set("interviewType", interviewType);
  return apiFetch(`/interviews?${params}`);
}

/**
 * Get cross-session performance progression.
 * GET /api/interviews/progress
 */
export function getInterviewProgress() {
  return apiFetch("/interviews/progress");
}
