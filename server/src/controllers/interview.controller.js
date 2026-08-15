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

// ── POST /api/interviews/:id/questions/:questionId/answers ────────────────────
async function submitAnswer(req, res, next) {
  try {
    const { durationMs } = req.body;
    const idempotencyKey  = req.headers["idempotency-key"] || null;

    const result = await interviewService.submitAnswer(
      req.params.id,
      req.params.questionId,
      req.user.id,
      {
        file:           req.file || null,
        durationMs:     durationMs ? Number(durationMs) : null,
        idempotencyKey,
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
    INVALID_INTERVIEW_STATE:    409,
    INTERVIEW_NOT_ACTIVE:       409,
    INTERVIEW_ALREADY_STARTED:  409,
    INTERVIEW_ALREADY_COMPLETED:409,
    QUESTION_ALREADY_ANSWERED:  409,
    DUPLICATE_ANSWER:           409,
    ANSWER_PROCESSING:          409,
    RETRY_LIMIT_REACHED:        409,
    TRANSCRIPTION_FAILED:       502,
    EVALUATION_FAILED:          502,
    QUESTION_GENERATION_FAILED: 502,
    EXPLANATION_FAILED:         502,
    REPORT_GENERATION_FAILED:   502,
    AUDIO_TOO_LARGE:            413,
    UNSUPPORTED_AUDIO_FORMAT:   415,
  };

  if (err.code && STATUS_MAP[err.code]) {
    return sendError(res, err.code, err.message, STATUS_MAP[err.code]);
  }

  // Unknown error — pass to global error handler
  return next(err);
}

module.exports = {
  createInterview,
  getInterview,
  startInterview,
  getCurrentQuestion,
  submitAnswer,
  getAnswerStatus,
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
