/**
 * interview.routes.js
 *
 * All 15 interview endpoints defined in interview-api.md §71.
 * All require authentication.
 *
 * IMPORTANT ordering notes:
 *   - /progress must appear BEFORE /:id to prevent Express treating
 *     "progress" as a session :id parameter
 *   - /explanations/continue before /explanations/:id (if any) for same reason
 */
"use strict";

const { Router } = require("express");
const { requireAuth }    = require("../middleware/auth");
const { uploadAudio }    = require("../middleware/uploadAudio");
const {
  createInterview,
  getInterview,
  startInterview,
  getCurrentQuestion,
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
} = require("../controllers/interview.controller");

const router = Router();

// All interview routes require a valid JWT
router.use(requireAuth);

// ── Collection routes (must be before /:id) ────────────────────────────────────
router.get("/progress", getInterviewProgress);
router.get("/",         getInterviewHistory);
router.post("/",        createInterview);

// ── Session routes ─────────────────────────────────────────────────────────────
router.get   ("/:id",              getInterview);
router.post  ("/:id/start",        startInterview);
router.get   ("/:id/current",      getCurrentQuestion);
router.post  ("/:id/next",         getNextAction);
router.post  ("/:id/end",          endInterview);

// ── Answer routes ──────────────────────────────────────────────────────────────
// uploadAudio middleware runs BEFORE the controller — validates + stores the file
router.post  ("/:id/questions/:questionId/answers", uploadAudio, submitAnswer);
router.get   ("/:id/answers/:answerAttemptId",       getAnswerStatus);
router.post  ("/:id/answers/:answerAttemptId/reevaluate", reevaluateAnswer);
router.post  ("/:id/questions/:questionId/retry",    retryQuestion);

// ── Explanation routes ─────────────────────────────────────────────────────────
router.post  ("/:id/explanations/continue", continueAfterExplanation);
router.post  ("/:id/explanations",          requestExplanation);

// ── Report routes ──────────────────────────────────────────────────────────────
router.post  ("/:id/report", generateReport);
router.get   ("/:id/report", getReport);

module.exports = router;
