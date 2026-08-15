/**
 * contextService.js
 *
 * Resolves and normalizes the interview context from selected sources,
 * then builds the immutable context snapshot stored on the session.
 *
 * Flow (per interview-architecture.md §13, interview-backend-spec.md §9–10):
 *   Resume Intelligence → ResumeVersion.interviewContext
 *   + User-provided config (company, role, JD)
 *   → Normalized InterviewContext
 *   → Immutable session snapshot (capturedAt interview start)
 *
 * The snapshot guarantees historical reproducibility — if the user later
 * uploads a new resume or changes their role, completed interviews remain
 * unaffected.
 */
"use strict";

const ResumeVersion = require("../../models/ResumeVersion");

/**
 * Resolve the resume version and verify ownership.
 * Throws a domain error if not found or not owned by the user.
 *
 * @param {string} resumeVersionId
 * @param {string} userId
 * @returns {Promise<object>} The ResumeVersion document
 */
async function resolveResumeVersion(resumeVersionId, userId) {
  const rv = await ResumeVersion.findOne({
    _id: resumeVersionId,
    userId,
    status: "ready",
  });

  if (!rv) {
    const err = new Error("Resume version not found or not ready.");
    err.code = "RESUME_CONTEXT_UNAVAILABLE";
    err.status = 404;
    throw err;
  }

  return rv;
}

/**
 * Build a normalized interview context object from selected sources.
 * This is the compact representation the question engine and AI receive —
 * NOT the full ResumeVersion document.
 *
 * @param {object} params
 * @param {string} params.mode - interview mode
 * @param {string} [params.company]
 * @param {string} [params.role]
 * @param {string} [params.jobDescription]
 * @param {object|null} [params.resumeVersion] - Resolved ResumeVersion doc (if resume source used)
 * @param {string} params.interviewType
 * @param {string} params.difficulty
 * @returns {object} Normalized interview context
 */
function buildNormalizedContext({ mode, company, role, jobDescription, resumeVersion, interviewType, difficulty }) {
  const ctx = {
    mode,
    interviewType,
    difficulty,
    company:          company?.trim() || "",
    role:             role?.trim()    || "",
    jobDescription:   jobDescription?.trim() || "",
    candidate:        {},
    resumeContext:    null,
  };

  // Populate from resume intelligence if a resume was provided
  if (resumeVersion) {
    const ic = resumeVersion.interviewContext || {};
    const cp = resumeVersion.candidateProfile || {};
    const prefs = cp.careerPreferences || {};

    ctx.candidate = {
      name:            cp.personal?.name            || "",
      experienceLevel: prefs.experienceLevel?.value  || ic.experienceLevel || "",
      targetRole:      prefs.targetRole?.value        || ic.targetRole      || role?.trim() || "",
    };

    ctx.resumeContext = {
      resumeVersionId:  resumeVersion._id,
      candidateSummary: ic.candidateSummary  || "",
      primarySkills:    ic.primarySkills     || [],
      projects:         (cp.projects || []).map(p => ({
        name:         p.name,
        description:  p.description,
        technologies: p.technologies || [],
        highlights:   p.highlights   || [],
      })).slice(0, 5),
      experience: (cp.experience || []).map(e => ({
        company:  e.company,
        role:     e.role,
        technologies: e.technologies || [],
      })).slice(0, 3),
      skills: {
        languages: cp.skills?.languages || [],
        frontend:  cp.skills?.frontend  || [],
        backend:   cp.skills?.backend   || [],
        databases: cp.skills?.databases || [],
        tools:     cp.skills?.tools     || [],
      },
    };

    // Override role from resume prefs if not explicitly provided
    if (!ctx.role && ctx.candidate.targetRole) {
      ctx.role = ctx.candidate.targetRole;
    }
  }

  return ctx;
}

/**
 * Build the immutable context snapshot to persist on the session.
 * Minimal subset of the normalized context — what's needed for session
 * reproducibility and the question engine.
 *
 * @param {object} normalizedCtx - Result of buildNormalizedContext()
 * @param {string|null} resumeVersionId
 * @returns {object} Context snapshot (matches InterviewSession.interviewContextSnapshot schema)
 */
function buildContextSnapshot(normalizedCtx, resumeVersionId) {
  const rc = normalizedCtx.resumeContext;
  return {
    candidateSummary:  rc?.candidateSummary  || "",
    primarySkills:     rc?.primarySkills     || [],
    projects:          rc ? rc.projects.map(p => p.name).filter(Boolean) : [],
    targetRole:        normalizedCtx.role    || normalizedCtx.candidate?.targetRole || "",
    experienceLevel:   normalizedCtx.candidate?.experienceLevel || "",
    company:           normalizedCtx.company    || "",
    jobDescription:    normalizedCtx.jobDescription || "",
    resumeVersionId:   resumeVersionId || null,
    capturedAt:        new Date(),
  };
}

module.exports = {
  resolveResumeVersion,
  buildNormalizedContext,
  buildContextSnapshot,
};
