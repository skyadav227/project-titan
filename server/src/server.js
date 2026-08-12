/**
 * server.js
 *
 * Entry point for the TITAN backend.
 * Connects to MongoDB, then starts the HTTP server.
 * Handles graceful shutdown on SIGTERM / SIGINT.
 */
"use strict";

// env.js must be required first — it calls dotenv.config() and exits early
// if required variables are missing.
const { PORT } = require("./config/env");
const { connectDB } = require("./config/db");
const { ensureUploadsDir } = require("./utils/fileUtils");
const app = require("./app");

async function start() {
  // Ensure uploads directory exists before any request arrives
  ensureUploadsDir();

  // Connect to MongoDB — process exits inside connectDB() on failure
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] TITAN API running on http://localhost:${PORT}`);
    console.log(`[server] Health: http://localhost:${PORT}/health`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  function shutdown(signal) {
    console.log(`\n[server] ${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log("[server] HTTP server closed");
      process.exit(0);
    });

    // Force-close after 10 s if connections are still open
    setTimeout(() => {
      console.error("[server] Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

start();
