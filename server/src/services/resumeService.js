/**
 * resumeService.js
 *
 * Orchestrates the full resume processing pipeline:
 *   uploaded → processing → (reading → extracting → understanding → building_context) → ready
 *                                                                                      ↘ failed
 *
 * This function is called by the resume controller via setImmediate after the
 * HTTP response has already been sent (non-blocking).
 *
 * Per the spec (PRD §10, decisions doc §10):
 *   Upload → Validation → File Storage → Text Extraction → Structured Parsing
 *   → AI Analysis → Schema Validation → Candidate Profile → Interview Context
 *   → Review → Activation
 */
"use strict";

const ResumeVersion  = require("../models/ResumeVersion");
const { extractText } = require("./extractionService");
const { parseResumeText } = require("./parsingService");
const { analyzeResume }   = require("./ai/aiService");

/**
 * Process a resume version through the full extraction + AI pipeline.
 * Updates the ResumeVersion document at each stage.
 * Never throws — all errors are caught and stored on the document.
 *
 * @param {string} resumeVersionId - MongoDB _id of the ResumeVersion document
 */
async function processResume(resumeVersionId) {
  let doc;

  try {
    doc = await ResumeVersion.findById(resumeVersionId).select(
      "+extractedText storageReference fileType status"
    );
    if (!doc) {
      console.error(`[resumeService] Version not found: ${resumeVersionId}`);
      return;
    }

    // Guard: only process from 'uploaded' state (idempotent retry safety)
    if (doc.status !== "uploaded") {
      console.warn(`[resumeService] Skipping ${resumeVersionId} — status is ${doc.status}`);
      return;
    }

    // ── Stage 1: processing / reading ─────────────────────────────────────
    await setStage(doc, "processing", "reading");

    // ── Stage 2: extract text ─────────────────────────────────────────────
    await setStage(doc, "processing", "extracting");
    const rawText = await extractText(doc.storageReference, doc.fileType);

    // Store extracted text (select:false — not returned to clients)
    doc.extractedText = rawText;
    await doc.save();

    // ── Stage 3: deterministic pre-parsing ────────────────────────────────
    // (No stage change needed — this is very fast and part of "extracting")
    const partialProfile = parseResumeText(rawText);

    // ── Stage 4: AI analysis ──────────────────────────────────────────────
    await setStage(doc, "processing", "understanding");
    const aiProfile = await analyzeResume(rawText, partialProfile);

    // ── Stage 5: merge pre-parsed fields (deterministic beats AI-inferred) ─
    // Personal fields extracted deterministically override AI values for them
    const mergedProfile = mergeProfiles(partialProfile, aiProfile);

    // ── Stage 6: build interview context ──────────────────────────────────
    await setStage(doc, "processing", "building_context");
    const interviewContext = buildInterviewContext(mergedProfile);

    // ── Stage 7: persist and mark ready ───────────────────────────────────
    doc.candidateProfile = mergedProfile;
    doc.interviewContext = interviewContext;
    doc.status           = "ready";
    doc.processingStage  = "complete";
    doc.processingError  = null;
    await doc.save();

    console.log(`[resumeService] ✓ Resume ${resumeVersionId} processed successfully.`);
  } catch (err) {
    console.error(`[resumeService] Processing failed for ${resumeVersionId}:`, err.message);

    // Store failure on the document — never crash the process
    if (doc) {
      try {
        doc.status          = "failed";
        doc.processingStage = null;
        // User-safe message from the thrown error, or generic fallback
        doc.processingError = err.message || "We couldn't process this resume. Please try again.";
        await doc.save();
      } catch (saveErr) {
        console.error("[resumeService] Could not save failure state:", saveErr.message);
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Update status + processingStage atomically and save.
 */
async function setStage(doc, status, stage) {
  doc.status          = status;
  doc.processingStage = stage;
  await doc.save();
}

/**
 * Merge the deterministic pre-parsed personal fields over AI-extracted values.
 * Where deterministic parsing found a value, it wins over the AI's guess
 * because regex on plain text is more reliable for structured fields like
 * email, phone, and LinkedIn URL.
 */
function mergeProfiles(partial, aiProfile) {
  const merged = { ...aiProfile };
  const p = partial?.personal || {};

  merged.personal = {
    ...aiProfile.personal,
    // Deterministic values override AI values when present
    ...(p.name      && { name:      p.name      }),
    ...(p.email     && { email:     p.email     }),
    ...(p.phone     && { phone:     p.phone     }),
    ...(p.location  && { location:  p.location  }),
    ...(p.linkedin  && { linkedin:  p.linkedin  }),
    ...(p.github    && { github:    p.github    }),
    ...(p.portfolio && { portfolio: p.portfolio }),
  };

  return merged;
}

/**
 * Build a compact interview context from the full candidate profile.
 * This is consumed by the future interview engine — it does NOT contain
 * the full profile to keep token usage minimal.
 */
function buildInterviewContext(profile) {
  // Gather all skills into a flat list
  const skills = profile?.skills || {};
  const allSkills = [
    ...(skills.languages || []),
    ...(skills.frontend  || []),
    ...(skills.backend   || []),
    ...(skills.databases || []),
    ...(skills.tools     || []),
    ...(skills.other     || []),
  ];

  // Take the most prominent skills (first 10 to keep context concise)
  const primarySkills = allSkills.slice(0, 10);

  // Project names for interview personalisation
  const projectNames = (profile?.projects || [])
    .map((p) => p.name)
    .filter(Boolean)
    .slice(0, 5);

  const targetRole     = profile?.careerPreferences?.targetRole?.value     || "";
  const experienceLevel = profile?.careerPreferences?.experienceLevel?.value || "";

  // One-line candidate summary
  const name = profile?.personal?.name || "Candidate";
  const level = experienceLevel ? `${experienceLevel} ` : "";
  const role  = targetRole      ? `${targetRole}`       : "professional";
  const candidateSummary = `${name} — ${level}${role}`;

  return {
    candidateSummary,
    primarySkills,
    projects: projectNames,
    targetRole,
    experienceLevel,
  };
}

module.exports = { processResume };
