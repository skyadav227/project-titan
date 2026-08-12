/**
 * upload.js — Multer file upload middleware
 *
 * Enforces server-side file validation per the spec (decisions doc §4):
 *   - Accepted MIME types: application/pdf, application/vnd.openxmlformats...
 *   - Accepted extensions: .pdf, .docx
 *   - Maximum file size: 5 MB
 *   - Files are stored with UUID filenames (not the original name) to avoid
 *     path traversal and filename conflicts.
 *   - Files are stored outside any publicly served directory.
 *
 * Client-side validation improves UX.
 * Server validation is authoritative and mandatory for security.
 *
 * Usage:
 *   router.post("/resumes", requireAuth, uploadResume, controller);
 */
"use strict";

const multer = require("multer");
const path   = require("path");
const { v4: uuidv4 } = require("uuid");
const { UPLOADS_PATH, ensureUploadsDir } = require("../utils/fileUtils");

// Ensure the uploads directory exists before Multer tries to write to it
ensureUploadsDir();

// ── Accepted file types ───────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ACCEPTED_EXTENSIONS = new Set([".pdf", ".docx"]);

// ── Storage: disk with UUID filenames ─────────────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_PATH);
  },
  filename(_req, file, cb) {
    // Use UUID + original extension so the file type remains identifiable
    // but the original filename is never used on disk (security)
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ── File filter ───────────────────────────────────────────────────────────────

function fileFilter(_req, file, cb) {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const extOk  = ACCEPTED_EXTENSIONS.has(ext);
  const mimeOk = ACCEPTED_MIME_TYPES.has(mime);

  if (extOk && mimeOk) {
    return cb(null, true);
  }

  // Reject with a typed error that errorHandler can catch
  const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume");
  err.code    = "INVALID_FILE_TYPE";
  err.message = "This file type isn't supported. Please upload a PDF or DOCX file.";
  return cb(err, false);
}

// ── Multer instance ───────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB — Multer throws LIMIT_FILE_SIZE if exceeded
    files: 1,                  // Only one file per request
  },
});

/**
 * Single-file upload middleware.
 * Expects the file in the multipart field named "resume".
 *
 * On success: req.file is populated with path, filename, size, mimetype.
 * On failure: passes a typed error to next() which errorHandler converts.
 */
const uploadResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (!err) return next();

    // Multer file-size error
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "Your resume must be 5 MB or smaller.",
        },
      });
    }

    // Our custom file-type error
    if (err.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_FILE_TYPE",
          message: "This file type isn't supported. Please upload a PDF or DOCX file.",
        },
      });
    }

    // Any other Multer or unexpected error
    return next(err);
  });
};

module.exports = { uploadResume };
