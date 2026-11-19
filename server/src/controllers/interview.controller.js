/**
 * interview.controller.js
 *
 * Thin HTTP layer for Interview Intelligence.
 * Responsibilities: parse request, validate, call service, return response.
 *
 * No AI logic, no scoring, no question generation, no state decisions here.
 * All intelligence lives in interviewService.js and its dependencies.
 *
 * Per interview-architecture.md §8, interview-backend-spec.md §62:
 *   Controller → Validation → Interview Service → Response
 */
"use strict";

const interviewService = require("../services/interviewService");
// Destructured for the two checkpoint additions (called via interviewService.X below)
const {
  getCheckpointState: _getCheckpointStateSvc,
  skipQuestion:       _skipQuestionSvc,
} = require("../services/interviewService");
const {
  validateCreateInterview,
  validateExplanationRequest,
  validateEndInterview,
} = require("../validators/interview.validator");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// ── POST /api/interviews ───────────────────────────────────────────────────────
async function createInterview(req, res, next) {
  try {
    const validation = validateCreateInterview(req.body);
    if (!validation.valid) {
      return sendError(res, "INVALID_CONFIGURATION", validation.errors.join(". "), 400);
    }

    const session = await interviewService.createInterview(req.user.id, req.body);
    return sendSuccess(res, session, 201);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/:id ────────────────────────────────────────────────────
async function getInterview(req, res, next) {
  try {
    const session = await interviewService.getInterview(req.params.id, req.user.id);
    return sendSuccess(res, session);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/start ────────────────────────────────────────────
async function startInterview(req, res, next) {
  try {
    const result = await interviewService.startInterview(req.params.id, req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/:id/current ───────────────────────────────────────────
async function getCurrentQuestion(req, res, next) {
  try {
    const question = await interviewService.getCurrentQuestion(req.params.id, req.user.id);
    return sendSuccess(res, { question });
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/:id/checkpoint ────────────────────────────────────────
async function getCheckpointState(req, res, next) {
  try {
    const result = await interviewService.getCheckpointState(req.params.id, req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/questions/:questionId/skip ───────────────────────
async function skipQuestion(req, res, next) {
  try {
    const result = await interviewService.skipQuestion(
      req.params.id,
      req.params.questionId,
      req.user.id
    );
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/questions/:questionId/answers ────────────────────
async function submitAnswer(req, res, next) {
  try {
    const { durationMs, text } = req.body;
    const idempotencyKey = req.headers["idempotency-key"] || null;

    const result = await interviewService.submitAnswer(
      req.params.id,
      req.params.questionId,
      req.user.id,
      {
        file:           req.file || null,
        durationMs:     durationMs ? Number(durationMs) : null,
        idempotencyKey,
        // `text` field: candidate's typed answer (bypasses STT — used for dev/text testing)
        // Per interview-api.md §19: "If client-side transcription is supported, transcript
        // may also be supplied." Here we use a text field for the same purpose.
        textAnswer:     typeof text === "string" && text.trim() ? text.trim() : null,
      }
    );

    // Return 200 (completed synchronously) or 202 (still processing)
    const statusCode = result.status === "completed" ? 200 : 202;
    return res.status(statusCode).json({ success: true, data: result });
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/:id/answers/:answerAttemptId ──────────────────────────
async function getAnswerStatus(req, res, next) {
  try {
    const result = await interviewService.getAnswerStatus(
      req.params.id,
      req.params.answerAttemptId,
      req.user.id
    );
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/questions/:questionId/retry ──────────────────────
async function retryQuestion(req, res, next) {
  try {
    const result = await interviewService.retryQuestion(
      req.params.id,
      req.params.questionId,
      req.user.id
    );
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/next ──────────────────────────────────────────────
async function getNextAction(req, res, next) {
  try {
    const result = await interviewService.getNextAction(req.params.id, req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/explanations ─────────────────────────────────────
async function requestExplanation(req, res, next) {
  try {
    const validation = validateExplanationRequest(req.body);
    if (!validation.valid) {
      return sendError(res, "INVALID_CONFIGURATION", validation.errors.join(". "), 400);
    }

    const result = await interviewService.requestExplanation(
      req.params.id,
      req.user.id,
      { questionId: req.body.questionId, topic: req.body.topic }
    );
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/explanations/continue ────────────────────────────
async function continueAfterExplanation(req, res, next) {
  try {
    const result = await interviewService.continueAfterExplanation(req.params.id, req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/end ──────────────────────────────────────────────
async function endInterview(req, res, next) {
  try {
    const validation = validateEndInterview(req.body);
    if (!validation.valid) {
      return sendError(res, "INVALID_CONFIGURATION", validation.errors.join(". "), 400);
    }

    const result = await interviewService.endInterview(
      req.params.id,
      req.user.id,
      req.body.reason || "user_ended"
    );
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/answers/:answerAttemptId/reevaluate ──────────────
async function reevaluateAnswer(req, res, next) {
  try {
    const isCheckpoint = req.body?.isCheckpoint === true;
    const result = await interviewService.reevaluateAnswer(
      req.params.id,
      req.params.answerAttemptId,
      req.user.id,
      { isCheckpoint }
    );
    // Return 200 (completed synchronously) — reevaluation is always synchronous in V1
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── POST /api/interviews/:id/report ───────────────────────────────────────────
async function generateReport(req, res, next) {
  try {
    const result = await interviewService.generateReport(req.params.id, req.user.id);
    return sendSuccess(res, result, 202);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/:id/report ────────────────────────────────────────────
async function getReport(req, res, next) {
  try {
    const result = await interviewService.getReport(req.params.id, req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews ────────────────────────────────────────────────────────
async function getInterviewHistory(req, res, next) {
  try {
    const { page, limit, status, mode, interviewType } = req.query;
    const result = await interviewService.getInterviewHistory(req.user.id, {
      page, limit, status, mode, interviewType,
    });
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── GET /api/interviews/progress ──────────────────────────────────────────────
async function getInterviewProgress(req, res, next) {
  try {
    const result = await interviewService.getInterviewProgress(req.user.id);
    return sendSuccess(res, result);
  } catch (err) {
    return _handleDomainError(err, res, next);
  }
}

// ── Error handler ─────────────────────────────────────────────────────────────

/**
 * Map domain errors to HTTP responses.
 * Never expose internal details.
 */
function _handleDomainError(err, res, next) {
  const STATUS_MAP = {
    INTERVIEW_NOT_FOUND:        404,
    QUESTION_NOT_FOUND:         404,
    ANSWER_NOT_FOUND:           404,
    RESUME_CONTEXT_UNAVAILABLE: 404,
    INVALID_CONFIGURATION:      400,
    INVALID_INTERVIEW_MODE:     400,
    INVALID_ANSWER:             400,
    INVALID_INTERVIEW_STATE:    409,
    INTERVIEW_NOT_ACTIVE:       409,
    INTERVIEW_ALREADY_STARTED:  409,
    INTERVIEW_ALREADY_COMPLETED:409,
    QUESTION_ALREADY_ANSWERED:  409,
    DUPLICATE_ANSWER:           409,
    ANSWER_PROCESSING:          409,
    RETRY_LIMIT_REACHED:        409,
    INTERVIEW_NOT_RESOLVED:     409,
    CHECKPOINT_EXHAUSTED:       422,
    EVALUATION_PENDING_REEVALUATION: 409,
    QUESTION_SKIPPED_DURING_EVALUATION: 409,
    REPORT_GENERATION_LEASE_LOST:       409,
    REPORT_GENERATING:                  409,
    CHECKPOINT_INTEGRITY_ERROR:         422,
    NO_ATTEMPT_FOUND:                   422,
    TRANSCRIPTION_FAILED:       502,
    EVALUATION_FAILED:          502,
    QUESTION_GENERATION_FAILED: 502,
    EXPLANATION_FAILED:         502,
    REPORT_GENERATION_FAILED:   502,
    // AI provider errors — all map to 502 (upstream failure)
    AI_CONFIG_ERROR:            500,
    AI_RATE_LIMIT:              503,  // 429 from provider → 503 to client (quota exhausted, retry later)
    AI_REASONING_OVERFLOW:      503,  // reasoning model consumed entire token budget → non-retryable, retry manually
    AI_SCHEMA_MISMATCH:         502,
    AI_INVALID_JSON:            502,
    AI_NETWORK_ERROR:           502,
    AI_PROVIDER_ERROR:          502,
    AI_EMPTY_RESPONSE:          502,
    START_FAILED:               502,
    SPEECH_CONFIG_ERROR:        500,
    SPEECH_NETWORK_ERROR:       502,
    SPEECH_PROVIDER_ERROR:      502,
    SPEECH_MALFORMED_RESPONSE: 502,
    SPEECH_EMPTY_TRANSCRIPT:   422,
    AUDIO_TOO_LARGE:            413,
    UNSUPPORTED_AUDIO_FORMAT:   415,
  };

  // Handle Mongoose CastError (invalid ObjectId) → safe 404
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return sendError(res, "INTERVIEW_NOT_FOUND", "Interview session not found.", 404);
  }

  if (err.code && STATUS_MAP[err.code]) {
    // Never expose AI_CONFIG_ERROR details to client
    const safeMessage = (err.code === "AI_CONFIG_ERROR")
      ? "The AI service is not configured. Please contact support."
      : err.message;
    // For EVALUATION_FAILED, TRANSCRIPTION_FAILED, and EVALUATION_PENDING_REEVALUATION,
    // include the attemptId so the frontend can route "Try Again" to reevaluateAnswer
    // instead of creating a duplicate submission (which would hit E11000).
    if ((err.code === "EVALUATION_FAILED" || err.code === "TRANSCRIPTION_FAILED" ||
         err.code === "EVALUATION_PENDING_REEVALUATION") && err.attemptId) {
      const extras = { attemptId: err.attemptId };
      if (err.transcript != null) extras.transcript = err.transcript;
      return sendError(res, err.code, safeMessage, STATUS_MAP[err.code], extras);
    }
    // For AI_RATE_LIMIT, include retryAfterMs so the frontend can display a countdown.
    if (err.code === "AI_RATE_LIMIT") {
      return sendError(res, err.code, safeMessage, STATUS_MAP[err.code],
        err.retryAfterMs ? { retryAfterMs: err.retryAfterMs } : null);
    }
    // For AI_REASONING_OVERFLOW, include attemptId when present so the frontend
    // can route Try Again to reevaluateAnswer rather than creating a duplicate attempt.
    if (err.code === "AI_REASONING_OVERFLOW" && err.attemptId) {
      return sendError(res, err.code, safeMessage, STATUS_MAP[err.code], { attemptId: err.attemptId });
    }
    return sendError(res, err.code, safeMessage, STATUS_MAP[err.code]);
  }

  // Unknown error — pass to global error handler (logs internally, returns generic 500)
  return next(err);
}

module.exports = {
  createInterview,
  getInterview,
  startInterview,
  getCurrentQuestion,
  getCheckpointState,
  skipQuestion,
  submitAnswer,
  getAnswerStatus,
  reevaluateAnswer,
  retryQuestion,
  getNextAction,
  requestExplanation,
  continueAfterExplanation,
  endInterview,
  generateReport,
  getReport,
  getInterviewHistory,
  getInterviewProgress,
};
