/**
 * resume.controller.js
 *
 * Handles all resume-related HTTP requests.
 *
 * Endpoints (Phase 1 — upload + reads):
 *   POST   /api/resumes                  Upload a new resume file → creates ResumeVersion
 *   GET    /api/resumes/active           Get the caller's active ResumeVersion
 *   GET    /api/resumes/:id              Get a specific ResumeVersion (owned by caller)
 *   GET    /api/resumes/:id/status       Get processing status + stage
 *
 * Endpoints wired here but implemented in Phase 2:
 *   POST   /api/resumes/:id/activate     Activate a ready version
 *   POST   /api/resumes/:id/retry        Re-trigger processing on a failed version
 *   DELETE /api/resumes/:id              Soft-delete (isActive → false)
 *
 * Ownership rule (decisions doc §20, PRD §33):
 *   Every query is scoped to req.user.id — a user can never access another
 *   user's resume data by manipulating an ID.
 */
"use strict";

const path           = require("path");
const ResumeVersion  = require("../models/ResumeVersion");
const { sendSuccess, sendError } = require("../utils/responseUtils");

// Processing orchestrator — fully implemented in Phase 2.
// Imported here so Phase 1 wires the call site; Phase 2 fills the body.
let resumeService;
function getResumeService() {
  if (!resumeService) {
    // Lazy-require so Phase 1 starts without Phase 2 files existing
    try {
      resumeService = require("../services/resumeService");
    } catch {
      resumeService = null;
    }
  }
  return resumeService;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive the next version number for a user.
 * Version numbers are 1-based and increment per user.
 */
async function getNextVersionNumber(userId) {
  const latest = await ResumeVersion
    .findOne({ userId })
    .sort({ version: -1 })
    .select("version");
  return latest ? latest.version + 1 : 1;
}

/**
 * Derive the fileType ('pdf' | 'docx') from the original filename.
 */
function deriveFileType(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".pdf")  return "pdf";
  if (ext === ".docx") return "docx";
  // Should never reach here — upload middleware already validated
  return "pdf";
}

/**
 * Safe projection of a ResumeVersion for the client.
 * extractedText is excluded (it's large and internal).
 */
function safeVersion(doc) {
  return {
    id:               doc._id,
    version:          doc.version,
    isActive:         doc.isActive,
    status:           doc.status,
    processingStage:  doc.processingStage,
    processingError:  doc.processingError,
    fileName:         doc.fileName,
    fileType:         doc.fileType,
    fileSize:         doc.fileSize,
    candidateProfile: doc.candidateProfile  ?? null,
    interviewContext: doc.interviewContext  ?? null,
    createdAt:        doc.createdAt,
    updatedAt:        doc.updatedAt,
  };
}

// ── POST /api/resumes ─────────────────────────────────────────────────────────

/**
 * Upload a new resume file.
 *
 * 1. Multer (upload middleware) has already validated and stored the file.
 * 2. Create a ResumeVersion document with status 'uploaded'.
 * 3. Return 202 Accepted immediately with the new version ID.
 * 4. Kick off processing asynchronously so the HTTP response is not blocked.
 */
async function uploadResume(req, res, next) {
  try {
    // Multer populates req.file after successful upload
    if (!req.file) {
      return sendError(res, "FILE_MISSING", "No resume file was provided.", 400);
    }

    const userId   = req.user.id;
    const version  = await getNextVersionNumber(userId);
    const fileType = deriveFileType(req.file.originalname);

    const resumeVersion = await ResumeVersion.create({
      userId,
      fileName:         req.file.originalname,
      fileType,
      fileSize:         req.file.size,
      storageReference: req.file.filename, // UUID-based filename set by Multer
      version,
      isActive:         false,
      status:           "uploaded",
      processingStage:  null,
    });

    // Respond immediately — do not wait for processing
    sendSuccess(
      res,
      { resumeVersionId: resumeVersion._id, version: resumeVersion.version },
      202
    );

    // Kick off the processing pipeline asynchronously.
    // setImmediate defers until the current I/O event completes (after res is sent).
    // Phase 2 implements processResume(); until then this is a no-op.
    const service = getResumeService();
    if (service && typeof service.processResume === "function") {
      setImmediate(() => {
        service.processResume(resumeVersion._id.toString()).catch((err) => {
          console.error("[resume.controller] Background processing error:", err.message);
        });
      });
    }
  } catch (err) {
    return next(err);
  }
}

// ── GET /api/resumes/active ───────────────────────────────────────────────────

/**
 * Get the caller's currently active ResumeVersion.
 * Returns { data: null } when no active version exists.
 */
async function getActiveResume(req, res, next) {
  try {
    const doc = await ResumeVersion.findOne({
      userId:   req.user.id,
      isActive: true,
    });

    return sendSuccess(res, doc ? safeVersion(doc) : null);
  } catch (err) {
    return next(err);
  }
}

async function getLatestResume(req, res, next) {
  try {
    const doc = await ResumeVersion.findOne({
      userId: req.user.id,
    }).sort({ version: -1 });

    return sendSuccess(res, doc ? safeVersion(doc) : null);
  } catch (err) {
    return next(err);
  }
}

// ── GET /api/resumes/:id ──────────────────────────────────────────────────────

/**
 * Get a specific ResumeVersion by ID.
 * Ownership is enforced — returns 404 (not 403) to avoid leaking existence.
 */
async function getResumeById(req, res, next) {
  try {
    const doc = await ResumeVersion.findOne({
      _id:    req.params.id,
      userId: req.user.id,
    });

    if (!doc) {
      return sendError(res, "NOT_FOUND", "Resume not found.", 404);
    }

    return sendSuccess(res, safeVersion(doc));
  } catch (err) {
    return next(err);
  }
}

// ── GET /api/resumes/:id/status ───────────────────────────────────────────────

/**
 * Lightweight status poll endpoint used by the frontend during processing.
 * Returns only status + processingStage to minimise payload size.
 */
async function getResumeStatus(req, res, next) {
  try {
    const doc = await ResumeVersion.findOne(
      { _id: req.params.id, userId: req.user.id },
      "status processingStage processingError"
    );

    if (!doc) {
      return sendError(res, "NOT_FOUND", "Resume not found.", 404);
    }

    return sendSuccess(res, {
      status:          doc.status,
      processingStage: doc.processingStage,
      processingError: doc.processingError,
    });
  } catch (err) {
    return next(err);
  }
}

// ── POST /api/resumes/:id/activate ────────────────────────────────────────────

/**
 * Activate a processed and review-ready ResumeVersion.
 *
 * Rules (decisions doc §19, PRD §9.3):
 *   - Only a version with status 'ready' can be activated.
 *   - Activating V2 atomically deactivates the previously active version.
 *   - One-active invariant is maintained.
 *
 * Fully implemented here (not deferred to Phase 2) because it is pure
 * database logic with no dependency on the AI pipeline.
 */
async function activateResume(req, res, next) {
  try {
    const userId     = req.user.id;
    const versionId  = req.params.id;

    // Find the target version — must belong to this user
    const target = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!target) {
      return sendError(res, "NOT_FOUND", "Resume not found.", 404);
    }

    // Only 'ready' versions can be activated
    if (target.status !== "ready") {
      return sendError(
        res,
        "NOT_READY",
        "This resume has not finished processing and cannot be activated yet.",
        400
      );
    }

    // Deactivate all other versions for this user (one-active invariant)
    await ResumeVersion.updateMany(
      { userId, _id: { $ne: versionId } },
      { $set: { isActive: false } }
    );

    // Activate the target
    target.isActive = true;
    await target.save();

    return sendSuccess(res, safeVersion(target));
  } catch (err) {
    return next(err);
  }
}

// ── POST /api/resumes/:id/retry ───────────────────────────────────────────────

/**
 * Re-trigger processing on a failed ResumeVersion.
 * Does NOT create a new document — retries the existing one.
 * (decisions doc §22, PRD §30)
 */
async function retryProcessing(req, res, next) {
  try {
    const userId    = req.user.id;
    const versionId = req.params.id;

    const doc = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!doc) {
      return sendError(res, "NOT_FOUND", "Resume not found.", 404);
    }

    if (doc.status !== "failed") {
      return sendError(
        res,
        "INVALID_STATE",
        "Only failed resumes can be retried.",
        400
      );
    }

    // Reset to uploaded so the pipeline runs again
    doc.status          = "uploaded";
    doc.processingStage = null;
    doc.processingError = null;
    await doc.save();

    // Respond immediately then kick off processing
    sendSuccess(res, { resumeVersionId: doc._id, status: doc.status });

    const service = getResumeService();
    if (service && typeof service.processResume === "function") {
      setImmediate(() => {
        service.processResume(doc._id.toString()).catch((err) => {
          console.error("[resume.controller] Retry processing error:", err.message);
        });
      });
    }
  } catch (err) {
    return next(err);
  }
}

// ── DELETE /api/resumes/:id ───────────────────────────────────────────────────

/**
 * Soft-delete a ResumeVersion.
 *
 * Per the spec (decisions doc §20, PRD §43):
 *   - Historical interviews may depend on this version — the MongoDB document
 *     is NOT hard-deleted in V1.
 *   - isActive is set to false.
 *   - The uploaded file on disk is NOT deleted in V1 to preserve reprocessing
 *     capability and historical integrity. Future versions can add a retention policy.
 */
async function deleteResume(req, res, next) {
  try {
    const userId    = req.user.id;
    const versionId = req.params.id;

    const doc = await ResumeVersion.findOne({ _id: versionId, userId });
    if (!doc) {
      return sendError(res, "NOT_FOUND", "Resume not found.", 404);
    }

    // Soft delete — preserve document for historical interview integrity
    doc.isActive = false;
    await doc.save();

    return sendSuccess(res, { message: "Resume removed from your active profile." });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadResume,
  getActiveResume,
  getLatestResume,
  getResumeById,
  getResumeStatus,
  activateResume,
  retryProcessing,
  deleteResume,
};
