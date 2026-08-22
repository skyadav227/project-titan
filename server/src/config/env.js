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
  AI_MODEL: process.env.AI_MODEL || "openrouter/free",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",

  // App URL (sent as HTTP-Referer to OpenRouter)
  APP_URL: process.env.APP_URL || "http://localhost:5173",

  // Speech / STT provider
  SPEECH_PROVIDER: process.env.SPEECH_PROVIDER || "local_whisper",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  SPEECH_MODEL: process.env.SPEECH_MODEL || "whisper-1",
  SPEECH_PYTHON_PATH: process.env.SPEECH_PYTHON_PATH || "",
  SPEECH_SCRIPT_PATH: process.env.SPEECH_SCRIPT_PATH || "",

  // Audio upload limits
  MAX_AUDIO_SIZE_MB: parseInt(process.env.MAX_AUDIO_SIZE_MB, 10) || 25,
  AUDIO_ACCEPTED_MIMES: (process.env.AUDIO_ACCEPTED_MIMES || "audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,audio/x-wav").split(",").map(s => s.trim()),

  // Interview configuration
  MAX_RETRIES_PER_QUESTION: parseInt(process.env.MAX_RETRIES_PER_QUESTION, 10) || 2,
  AI_MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES, 10) || 3,
  AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000,

  // Derived
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};
