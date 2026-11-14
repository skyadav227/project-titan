/**
 * resumeService.js
 *
 * All resume-related API calls for the frontend.
 * Maps to the backend resume routes built in Phase 1.
 */

import { apiFetch } from "./api";

/**
 * Upload a new resume file.
 * Returns { resumeVersionId, version }
 * @param {File} file
 */
export async function uploadResume(file) {
  const form = new FormData();
  form.append("resume", file);
  return apiFetch("/resumes", { method: "POST", body: form });
}

/**
 * Get the current user's active ResumeVersion (or null).
 */
export async function getActiveResume() {
  return apiFetch("/resumes/active");
}

/**
 * Get the user's latest ResumeVersion.
 */
export async function getLatestResume() {
  return apiFetch("/resumes/latest");
}

/**
 * Get a specific ResumeVersion by ID.
 * @param {string} id
 */
export async function getResumeById(id) {
  return apiFetch(`/resumes/${id}`);
}

/**
 * Poll the processing status of a resume version.
 * Returns { status, processingStage, processingError }
 * @param {string} id
 */
export async function getResumeStatus(id) {
  return apiFetch(`/resumes/${id}/status`);
}

/**
 * Activate a review-ready ResumeVersion.
 * @param {string} id
 */
export async function activateResume(id) {
  return apiFetch(`/resumes/${id}/activate`, { method: "POST" });
}

/**
 * Retry a failed ResumeVersion.
 * @param {string} id
 */
export async function retryResume(id) {
  return apiFetch(`/resumes/${id}/retry`, { method: "POST" });
}

/**
 * Soft-delete a ResumeVersion.
 * @param {string} id
 */
export async function deleteResume(id) {
  return apiFetch(`/resumes/${id}`, { method: "DELETE" });
}

/**
 * Get all resume versions for the current user (history list).
 * Returns { versions: ResumeVersion[] }
 */
export const getResumeHistory = () => apiFetch("/resumes");
