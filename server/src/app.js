/**
 * app.js
 *
 * Configures and exports the Express application.
 * Does NOT start the HTTP server — that is done in server.js.
 * Keeping them separate makes the app easier to test and reason about.
 *
 * Middleware order:
 *   1. CORS
 *   2. JSON body parser
 *   3. Routes
 *   4. 404 handler
 *   5. Global error handler (must be last)
 */
"use strict";

const express      = require("express");
const cors         = require("cors");
const authRoutes   = require("./routes/auth.routes");
const resumeRoutes = require("./routes/resume.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow the Vite dev server (port 5173) and any production origin.
// In production, replace the origin with your actual domain.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173", // vite preview
];

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────────
// JSON and URL-encoded bodies for non-file routes.
// Multer handles multipart/form-data on the upload route directly.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/resumes", resumeRoutes);

// ── 404 — unmatched routes ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found." },
  });
});

// ── Global error handler — must be the last middleware ────────────────────────
app.use(errorHandler);

module.exports = app;
