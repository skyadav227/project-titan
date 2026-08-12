/**
 * errorHandler.js — Global Express error handler
 *
 * Must be registered last in app.js (after all routes).
 * Catches any error passed to next(err) and converts it to a
 * consistent { success: false, error: { code, message } } response.
 *
 * Technical details (stack traces, DB errors, etc.) are logged
 * server-side only and never sent to the client.
 */
"use strict";

const { IS_PRODUCTION } = require("../config/env");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Always log the full error server-side
  console.error("[errorHandler]", err);

  // Mongoose duplicate key (e.g. duplicate email on register)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({
      success: false,
      error: {
        code: "DUPLICATE_VALUE",
        message: `An account with that ${field} already exists.`,
      },
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: messages.join(" "),
      },
    });
  }

  // Multer file size limit exceeded
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: "Your resume must be 5 MB or smaller.",
      },
    });
  }

  // Multer unexpected field
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FIELD",
        message: "Unexpected file field. Use the 'resume' field name.",
      },
    });
  }

  // JWT errors that somehow escape the auth middleware
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token." },
    });
  }

  // Default — generic 500
  const statusCode = err.statusCode || err.status || 500;
  const message = IS_PRODUCTION
    ? "Something went wrong. Please try again."
    : err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    error: { code: "SERVER_ERROR", message },
  });
}

module.exports = { errorHandler };
