/**
 * auth.js — JWT authentication middleware
 *
 * Verifies the Authorization: Bearer <token> header on every protected route.
 * On success, attaches req.user = { id, name, email } and calls next().
 * On failure, responds with 401 — never 403, to avoid leaking resource existence.
 *
 * Usage:
 *   router.get("/protected", requireAuth, controller);
 */
"use strict";

const jwt  = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { sendError }  = require("../utils/responseUtils");

/**
 * Extract the Bearer token from the Authorization header.
 * Returns null if the header is absent or malformed.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * requireAuth middleware.
 * Attaches req.user on success; sends 401 on any failure.
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return sendError(res, "UNAUTHORIZED", "Authentication required.", 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach minimal user info — controllers use req.user.id for ownership checks
    req.user = {
      id:    payload.sub,
      name:  payload.name,
      email: payload.email,
    };
    return next();
  } catch (err) {
    // TokenExpiredError, JsonWebTokenError, etc.
    return sendError(res, "UNAUTHORIZED", "Invalid or expired token.", 401);
  }
}

module.exports = { requireAuth };
