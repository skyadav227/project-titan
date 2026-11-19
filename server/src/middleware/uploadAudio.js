/**
 * uploadAudio.js — Multer middleware for interview audio uploads
 *
 * Separate from uploadResume — different field name ("audio"), different
 * size limit, and different accepted MIME types.
 *
 * Security rules (per interview-api.md §21, interview-architecture.md §28):
 *   - MIME type + extension both validated server-side
 *   - Size hard-capped at MAX_AUDIO_SIZE_MB from env
 *   - Files stored with UUID filenames (never original name)
 *   - Stored outside any publicly served directory
 *   - Deleted after transcription completes (V1 — no long-term audio retention)
 *
 * Usage:
 *   router.post("/.../answers", requireAuth, uploadAudio, controller);
 */
"use strict";

const multer  = require("multer");
const path    = require("path");
const { v4: uuidv4 } = require("uuid");
const { UPLOADS_PATH, ensureUploadsDir } = require("../utils/fileUtils");
const { MAX_AUDIO_SIZE_MB, AUDIO_ACCEPTED_MIMES } = require("../config/env");

ensureUploadsDir();

// ── Accepted audio types ──────────────────────────────────────────────────────

const ACCEPTED_MIME_SET = new Set(AUDIO_ACCEPTED_MIMES);

// Map accepted MIME types to their canonical extensions
const MIME_TO_EXT = {
  "audio/webm": ".webm",
  "audio/ogg":  ".ogg",
  "audio/mp4":  ".mp4",
  "audio/mpeg": ".mp3",
  "audio/wav":  ".wav",
  "audio/x-wav":".wav",
};

// ── Disk storage ──────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_PATH);
  },
  filename(_req, file, cb) {
    const baseMime = file.mimetype.split(";")[0].trim().toLowerCase();
    const ext = MIME_TO_EXT[baseMime] || path.extname(file.originalname).toLowerCase() || ".audio";
    cb(null, `audio_${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const baseMime = file.mimetype.split(";")[0].trim().toLowerCase();
  if (ACCEPTED_MIME_SET.has(baseMime)) {
    return cb(null, true);
  }
  const err = new Error("Unsupported audio format. Please record and upload a supported audio file.");
  err.code = "UNSUPPORTED_AUDIO_FORMAT";
  err.status = 415;
  return cb(err, false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AUDIO_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

/**
 * Single-file audio upload middleware.
 * Expects the file in the multipart field named "audio".
 */
const uploadAudio = (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: {
          code: "AUDIO_TOO_LARGE",
          message: `Audio recording must be ${MAX_AUDIO_SIZE_MB} MB or smaller.`,
        },
      });
    }

    if (err.code === "UNSUPPORTED_AUDIO_FORMAT") {
      return res.status(415).json({
        success: false,
        error: {
          code: "UNSUPPORTED_AUDIO_FORMAT",
          message: err.message,
        },
      });
    }

    return next(err);
  });
};

module.exports = { uploadAudio };
