/**
 * ResumeVersion.js
 *
 * Mongoose model for resume versions.
 *
 * Core invariants enforced at the application layer (see resumeService):
 *   - Every uploaded resume is a distinct ResumeVersion document.
 *   - At most one version per user may have isActive: true.
 *   - Uploading a new resume never overwrites or deletes an existing document.
 *   - Historical versions remain intact when a newer version is activated.
 *   - Candidate Profile data is scoped to the version that generated it.
 *
 * Per the spec (decisions doc §5, PRD §9, §34):
 *   status lifecycle:  uploaded → processing → ready | failed
 *   processingStage:  reading → extracting → understanding → building_context → complete
 */
"use strict";

const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const personalSchema = new mongoose.Schema(
  {
    name:      { type: String, default: "" },
    email:     { type: String, default: "" },
    phone:     { type: String, default: "" },
    location:  { type: String, default: "" },
    linkedin:  { type: String, default: "" },
    github:    { type: String, default: "" },
    portfolio: { type: String, default: "" },
  },
  { _id: false }
);

const skillsSchema = new mongoose.Schema(
  {
    languages:  { type: [String], default: [] },
    frontend:   { type: [String], default: [] },
    backend:    { type: [String], default: [] },
    databases:  { type: [String], default: [] },
    tools:      { type: [String], default: [] },
    other:      { type: [String], default: [] },
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    company:      { type: String, default: "" },
    role:         { type: String, default: "" },
    location:     { type: String, default: "" },
    startDate:    { type: String, default: "" },
    endDate:      { type: String, default: "" },
    description:  { type: [String], default: [] },
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    institution: { type: String, default: "" },
    degree:      { type: String, default: "" },
    field:       { type: String, default: "" },
    startDate:   { type: String, default: "" },
    endDate:     { type: String, default: "" },
    grade:       { type: String, default: "" },
  },
  { _id: false }
);

const projectEntrySchema = new mongoose.Schema(
  {
    name:         { type: String, default: "" },
    description:  { type: String, default: "" },
    technologies: { type: [String], default: [] },
    url:          { type: String, default: "" },
    highlights:   { type: [String], default: [] },
  },
  { _id: false }
);

const certificationEntrySchema = new mongoose.Schema(
  {
    name:          { type: String, default: "" },
    issuer:        { type: String, default: "" },
    date:          { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
  },
  { _id: false }
);

// Career preference with provenance tracking (decisions doc §9)
const provenanceValueSchema = new mongoose.Schema(
  {
    value:  { type: String, default: "" },
    // source: 'resume' | 'user' | 'system' | 'ai_inferred'
    source: {
      type: String,
      enum: ["resume", "user", "system", "ai_inferred", "unknown"],
      default: "unknown",
    },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    personal:         { type: personalSchema,                   default: () => ({}) },
    skills:           { type: skillsSchema,                     default: () => ({}) },
    experience:       { type: [experienceEntrySchema],          default: [] },
    education:        { type: [educationEntrySchema],           default: [] },
    projects:         { type: [projectEntrySchema],             default: [] },
    certifications:   { type: [certificationEntrySchema],       default: [] },
    achievements:     { type: [String],                         default: [] },
    careerPreferences: {
      targetRole:      { type: provenanceValueSchema, default: () => ({}) },
      experienceLevel: { type: provenanceValueSchema, default: () => ({}) },
    },
  },
  { _id: false }
);

// Compact interview context — consumed by the future interview engine
const interviewContextSchema = new mongoose.Schema(
  {
    candidateSummary: { type: String, default: "" },
    primarySkills:    { type: [String], default: [] },
    projects:         { type: [String], default: [] },
    targetRole:       { type: String, default: "" },
    experienceLevel:  { type: String, default: "" },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────

const resumeVersionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── File metadata ──────────────────────────────────────────────────────
    fileName:         { type: String, required: true },
    fileType:         { type: String, enum: ["pdf", "docx"], required: true },
    fileSize:         { type: Number, required: true }, // bytes
    // UUID-based filename on disk — never the original name (security)
    storageReference: { type: String, required: true },

    // ── Version tracking ──────────────────────────────────────────────────
    version:  { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: false, index: true },

    // ── Processing lifecycle ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
      index: true,
    },
    processingStage: {
      type: String,
      enum: ["reading", "extracting", "understanding", "building_context", "complete", null],
      default: null,
    },
    // Human-readable error message if status === 'failed' (safe for client)
    processingError: { type: String, default: null },

    // ── Extracted content ─────────────────────────────────────────────────
    // Raw text is stored for potential re-processing but NOT returned to clients
    extractedText: { type: String, default: null, select: false },

    // ── Structured candidate data ─────────────────────────────────────────
    candidateProfile: { type: candidateProfileSchema, default: null },
    interviewContext: { type: interviewContextSchema, default: null },

    // ── Provenance metadata ───────────────────────────────────────────────
    provenanceMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// ── Compound index: fast lookup of a user's active resume ─────────────────────
resumeVersionSchema.index({ userId: 1, isActive: 1 });

// ── Compound index: fast lookup of all versions for a user ───────────────────
resumeVersionSchema.index({ userId: 1, createdAt: -1 });

const ResumeVersion = mongoose.model("ResumeVersion", resumeVersionSchema);

module.exports = ResumeVersion;
