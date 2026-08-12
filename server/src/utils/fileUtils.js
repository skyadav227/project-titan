/**
 * fileUtils.js
 *
 * Helpers for working with uploaded resume files.
 * Centralised here so storage strategy (local disk → cloud) can be
 * swapped later without touching controllers or services.
 */
"use strict";

const path = require("path");
const fs   = require("fs");
const { UPLOAD_DIR } = require("../config/env");

/**
 * Absolute path to the uploads directory.
 * Resolved from the server root (two levels up from src/utils/).
 */
const UPLOADS_PATH = path.resolve(__dirname, "..", "..", UPLOAD_DIR);

/**
 * Ensure the uploads directory exists on startup.
 */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    console.log(`[fileUtils] Created uploads directory: ${UPLOADS_PATH}`);
  }
}

/**
 * Build the full absolute path for a stored file given its storage reference
 * (the UUID-based filename stored in the database).
 *
 * @param {string} storageReference - UUID filename (e.g. "abc123.pdf")
 * @returns {string} Absolute path
 */
function resolveStoragePath(storageReference) {
  return path.join(UPLOADS_PATH, storageReference);
}

/**
 * Delete a file from local storage by its storage reference.
 * Fails silently — does not throw if the file is already gone.
 *
 * @param {string} storageReference
 */
function deleteStoredFile(storageReference) {
  try {
    const filePath = resolveStoragePath(storageReference);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[fileUtils] Could not delete file ${storageReference}:`, err.message);
  }
}

/**
 * Read a stored file as a Buffer.
 *
 * @param {string} storageReference
 * @returns {Buffer}
 */
function readStoredFile(storageReference) {
  const filePath = resolveStoragePath(storageReference);
  return fs.readFileSync(filePath);
}

module.exports = {
  UPLOADS_PATH,
  ensureUploadsDir,
  resolveStoragePath,
  deleteStoredFile,
  readStoredFile,
};
