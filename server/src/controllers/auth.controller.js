/**
 * auth.controller.js
 *
 * Handles user registration, login, logout, and session retrieval.
 * All endpoints return { success, data } or { success, error } via responseUtils.
 *
 * Security notes:
 *   - Passwords are hashed with bcrypt (cost factor 12) before storage.
 *   - JWTs are signed with JWT_SECRET and expire per JWT_EXPIRES_IN.
 *   - The passwordHash field has select:false on the model — it is explicitly
 *     selected only when needed for comparison and never returned to clients.
 *   - Error messages on login are deliberately vague to prevent user enumeration.
 */
"use strict";

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sign a JWT for the given user.
 * @param {import('../models/User').User} user
 * @returns {string}
 */
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Safe user object to return to clients — never includes passwordHash.
 */
function safeUser(user) {
  return {
    id:        user._id,
    name:      user.name,
    email:     user.email,
    createdAt: user.createdAt,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Basic input presence check (schema validation catches format issues)
    if (!name || !email || !password) {
      return sendError(res, "VALIDATION_ERROR", "Name, email, and password are required.");
    }

    if (password.length < 8) {
      return sendError(res, "VALIDATION_ERROR", "Password must be at least 8 characters.");
    }

    // Check for existing user before hashing (fast exit)
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, "DUPLICATE_VALUE", "An account with that email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user);

    return sendSuccess(res, { token, user: safeUser(user) }, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "VALIDATION_ERROR", "Email and password are required.");
    }

    // Explicitly select passwordHash (excluded by default via select:false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

    // Deliberate vague message — do not distinguish "user not found" from "wrong password"
    if (!user) {
      return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const token = signToken(user);

    return sendSuccess(res, { token, user: safeUser(user) });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/logout
 * JWT is stateless — logout is handled client-side by discarding the token.
 * This endpoint exists for completeness and future cookie/session support.
 */
function logout(_req, res) {
  return sendSuccess(res, { message: "Logged out successfully." });
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user. Requires requireAuth middleware.
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, "NOT_FOUND", "User not found.", 404);
    }
    return sendSuccess(res, { user: safeUser(user) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, logout, me };
