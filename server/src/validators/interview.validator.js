/**
 * interview.validator.js
 *
 * Request body validation for all interview endpoints.
 * Follows the same pattern as the existing project — pure functions
 * that return { valid, errors } rather than throwing.
 *
 * Per interview-api.md §12 — all validation is server-side authoritative.
 */
"use strict";

const VALID_MODES = new Set(["company", "role", "job_description", "resume", "mixed"]);
const VALID_TYPES = new Set(["technical", "behavioral", "mixed", "role_specific"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard", "adaptive"]);
const VALID_DURATIONS = new Set([10, 15, 20, 30, 45, 60]);

/**
 * Validate POST /api/interviews body.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
function validateCreateInterview(body) {
  const errors = [];
  const {
    mode,
    company,
    role,
    jobDescription,
    useResume,
    resumeVersionId,
    interviewType,
    difficulty,
    durationMinutes,
    questionLimit,
  } = body || {};

  // Mode is required
  if (!mode || !VALID_MODES.has(mode)) {
    errors.push(`mode must be one of: ${[...VALID_MODES].join(", ")}`);
  }

  // Per-mode required field validation (interview-api.md §12)
  if (mode === "company" && !company?.trim()) {
    errors.push("company is required for company mode");
  }
  if (mode === "role" && !role?.trim()) {
    errors.push("role is required for role mode");
  }
  if (mode === "job_description" && !jobDescription?.trim()) {
    errors.push("jobDescription is required for job_description mode");
  }
  if (mode === "resume" && !useResume) {
    errors.push("useResume must be true for resume mode");
  }
  if (mode === "mixed") {
    const sources = [company?.trim(), role?.trim(), jobDescription?.trim(), useResume].filter(Boolean);
    if (sources.length < 2) {
      errors.push("mixed mode requires at least two meaningful context sources");
    }
  }

  // If resume is requested, a resumeVersionId must be provided
  if (useResume && !resumeVersionId) {
    errors.push("resumeVersionId is required when useResume is true");
  }

  // Interview type
  if (interviewType && !VALID_TYPES.has(interviewType)) {
    errors.push(`interviewType must be one of: ${[...VALID_TYPES].join(", ")}`);
  }

  // Difficulty
  if (difficulty && !VALID_DIFFICULTIES.has(difficulty)) {
    errors.push(`difficulty must be one of: ${[...VALID_DIFFICULTIES].join(", ")}`);
  }

  // Duration
  if (durationMinutes !== undefined && !VALID_DURATIONS.has(Number(durationMinutes))) {
    errors.push(`durationMinutes must be one of: ${[...VALID_DURATIONS].join(", ")}`);
  }

  // Question limit
  if (questionLimit !== undefined) {
    const ql = Number(questionLimit);
    if (!Number.isInteger(ql) || ql < 1 || ql > 50) {
      errors.push("questionLimit must be an integer between 1 and 50");
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate POST /api/interviews/:id/explanations body.
 */
function validateExplanationRequest(body) {
  const errors = [];
  const { questionId, topic } = body || {};

  if (!questionId) errors.push("questionId is required");
  if (!topic?.trim()) errors.push("topic is required");

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate POST /api/interviews/:id/end body.
 */
function validateEndInterview(body) {
  const VALID_REASONS = new Set(["user_ended", "time_limit", "system_completed"]);
  const { reason } = body || {};
  if (reason && !VALID_REASONS.has(reason)) {
    return { valid: false, errors: [`reason must be one of: ${[...VALID_REASONS].join(", ")}`] };
  }
  return { valid: true };
}

module.exports = {
  validateCreateInterview,
  validateExplanationRequest,
  validateEndInterview,
};
