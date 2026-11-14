/**
 * resume.routes.js
 *
 * All resume endpoints require authentication.
 *
 * Routes:
 *   POST   /api/resumes                  Upload new resume file
 *   GET    /api/resumes/active           Get caller's active version
 *   GET    /api/resumes/:id              Get specific version
 *   GET    /api/resumes/:id/status       Get processing status (poll endpoint)
 *   POST   /api/resumes/:id/activate     Activate a ready version
 *   POST   /api/resumes/:id/retry        Retry a failed version
 *   DELETE /api/resumes/:id              Soft-delete a version
 *
 * Note: /active must be defined BEFORE /:id to prevent Express treating
 * "active" as an :id parameter.
 */
"use strict";

const { Router } = require("express");
const { requireAuth }  = require("../middleware/auth");
const { uploadResume: uploadMiddleware } = require("../middleware/upload");
const {
  uploadResume,
  getActiveResume,
  getLatestResume,
  getResumeById,
  getResumeStatus,
  activateResume,
  retryProcessing,
  deleteResume,
  getResumeHistory,
} = require("../controllers/resume.controller");

const router = Router();

// All resume routes require a valid JWT
router.use(requireAuth);

// ── Collection routes ─────────────────────────────────────────────────────────
router.post("/",       uploadMiddleware, uploadResume);
router.get("/active", getActiveResume);
router.get("/latest", getLatestResume);
router.get("/",        getResumeHistory);

// ── Item routes ───────────────────────────────────────────────────────────────
router.get   ("/:id",          getResumeById);
router.get   ("/:id/status",   getResumeStatus);
router.post  ("/:id/activate", activateResume);
router.post  ("/:id/retry",    retryProcessing);
router.delete("/:id",          deleteResume);

module.exports = router;
