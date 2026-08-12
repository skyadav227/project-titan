/**
 * responseUtils.js
 *
 * Consistent response shape used across all controllers.
 * Every API response is one of:
 *   { success: true,  data: <payload> }
 *   { success: false, error: { code, message } }
 */
"use strict";

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {any} data   - Payload to return under `data`
 * @param {number} statusCode - HTTP status (default 200)
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code     - Machine-readable error code (e.g. "INVALID_FILE_TYPE")
 * @param {string} message  - Human-readable message safe to show the client
 * @param {number} statusCode - HTTP status (default 400)
 */
function sendError(res, code, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: { code, message } });
}

module.exports = { sendSuccess, sendError };
