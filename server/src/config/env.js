/**
 * env.js
 *
 * Loads and validates all required environment variables at startup.
 * The server will not start if any required variable is missing.
 * This makes misconfiguration loud rather than silent.
 */
"use strict";

require("dotenv").config();

const REQUIRED = [
  "MONGO_URI",
  "JWT_SECRET",
];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[env] Missing required environment variable: ${key}`);
    console.error(`[env] Copy .env.example to .env and fill in all required values.`);
    process.exit(1);
  }
}

module.exports = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // File storage — directory is relative to the server root (not public)
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",

  // AI provider
  AI_PROVIDER: process.env.AI_PROVIDER || "openrouter",
  AI_MODEL: process.env.AI_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",

  // App URL (sent as HTTP-Referer to OpenRouter)
  APP_URL: process.env.APP_URL || "http://localhost:5173",

  // Derived
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};
