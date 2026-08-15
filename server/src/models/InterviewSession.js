/**
 * InterviewSession.js
 *
 * Persistent state for one TITAN interview session.
 *
 * Lifecycle: created → starting → active → completing → completed
 *            OR: active → abandoned | active → failed
 *
 * The finalReport is embedded directly (belongs exclusively to this session,
 * produced once, always retrieved together — see interview-data-model.md §7).
 *
 * The interviewContextSnapshot is captured at session start and is immutable.
 * It guarantees historical reproducibility even if the user later changes
 * their resume, role, or preferences.
 *
 * Per interview-data-model.md §6, §23, §38.
 */
"use strict";

const mongoose = require("mongoose");

// ── Interview context snapshot sub-schema ─────────────────────────────────────
// Compact context captured at session start — consumed by the question engine.
// Must NOT duplicate the full ResumeVersion; only what the engine needs.
const interviewContextSnapshotSchema = new mongoose.Schema(
  {
    candidateSummary:  { type: String, default: "" },
    primarySkills:     { type: [String], default: [] },
    projects:          { type: [String], default: [] },
    targetRole:        { type: String, default: "" },
    experienceLevel:   { type: String, default: "" },
    company:           { type: String, default: "" },
    jobDescription:    { type: String, default: "" },
    resumeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeVersion",
      default: null,
    },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Session configuration sub-schema ─────────────────────────────────────────
const configurationSchema = new mongoose.Schema(
  {
    // Which context sources were selected (may be multiple for mixed)
    contextSources: {
      type: [String],
      enum: ["company", "role", "job_description", "resume"],
      default: [],
    },
    company:        { type: String, default: "", trim: true },
    targetRole:     { type: String, default: "", trim: true },
    jobDescription: { type: String, default: "" },
    interviewType: {
      type: String,
      enum: ["technical", "behavioral", "mixed", "role_specific"],
      default: "mixed",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "adaptive"],
      default: "adaptive",
    },
    durationMinutes: {
      type: Number,
      enum: [10, 15, 20, 30, 45, 60],
      default: 30,
    },
    questionLimit: {
      type: Number,
      min: 1,
      max: 50,
      default: 10,
    },
  },
  { _id: false }
);

// ── Session progress sub-schema ───────────────────────────────────────────────
const progressSchema = new mongoose.Schema(
  {
    currentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      default: null,
    },
    currentQuestionNumber: { type: Number, default: 0 },
    questionsCompleted:    { type: Number, default: 0, min: 0 },
    totalQuestions:        { type: Number, default: 0, min: 0 },
    attemptsCount:         { type: Number, default: 0, min: 0 },
    retryCount:            { type: Number, default: 0, min: 0 },
    lastCompletedQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      default: null,
    },
  },
  { _id: false }
);

// ── Processing state sub-schema (for in-progress server operations) ───────────
const processingSchema = new mongoose.Schema(
  {
    operation: {
      type: String,
      enum: [
        null,
        "starting",
        "generating_question",
        "processing_answer",
        "generating_follow_up",
        "finalizing",
      ],
      default: null,
    },
    operationStartedAt: { type: Date, default: null },
    operationId:        { type: String, default: null },
    errorCode:          { type: String, default: null },
    errorMessage:       { type: String, default: null },
    retryable:          { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Final report sub-schema (embedded — one per session) ─────────────────────
// Persisted here because report belongs exclusively to this session and has
// no independent lifecycle. See interview-data-model.md §7.
const questionBreakdownEntrySchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
    },
    questionText: { type: String, default: "" },
    bestScore:    { type: Number, default: null },
    attempts:     { type: Number, default: 1 },
    improved:     { type: Boolean, default: false },
  },
  { _id: false }
);

const finalReportSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, min: 0, max: 100, default: null },

    dimensions: {
      technicalAccuracy: { type: Number, min: 0, max: 100, default: null },
      communication:     { type: Number, min: 0, max: 100, default: null },
      clarity:           { type: Number, min: 0, max: 100, default: null },
      structure:         { type: Number, min: 0, max: 100, default: null },
      relevance:         { type: Number, min: 0, max: 100, default: null },
      problemSolving:    { type: Number, min: 0, max: 100, default: null },
    },

    speech: {
      averageSpeakingRate:        { type: Number, default: null },
      totalFillerWords:           { type: Number, default: null },
      averageFillerRate:          { type: Number, default: null },
      averageResponseDurationMs:  { type: Number, default: null },
    },

    strengths:        { type: [String], default: [] },
    improvements:     { type: [String], default: [] },
    knowledgeGaps:    { type: [String], default: [] },
    recommendations:  { type: [String], default: [] },

    statistics: {
      questionsAnswered:   { type: Number, default: 0 },
      totalAttempts:       { type: Number, default: 0 },
      retryCount:          { type: Number, default: 0 },
      improvedAttempts:    { type: Number, default: 0 },
    },

    questionBreakdown: { type: [questionBreakdownEntrySchema], default: [] },

    status: {
      type: String,
      enum: ["not_started", "generating", "ready", "failed"],
      default: "not_started",
    },

    generatedAt: { type: Date, default: null },

    aiMetadata: {
      provider:       { type: String, default: null },
      model:          { type: String, default: null },
      promptVersion:  { type: String, default: null },
      analysisVersion:{ type: String, default: null },
      latencyMs:      { type: Number, default: null },
      generatedAt:    { type: Date,   default: null },
    },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────
const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Retained for historical reproducibility — never updated after session start
    resumeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeVersion",
      default: null,
    },

    // Persistent session lifecycle
    // (interview-data-model.md §50, interview-api.md §7)
    status: {
      type: String,
      enum: [
        "created",
        "starting",
        "active",
        "paused",
        "completing",
        "completed",
        "abandoned",
        "failed",
      ],
      default: "created",
      index: true,
    },

    configuration: {
      type: configurationSchema,
      default: () => ({}),
    },

    // Immutable snapshot captured at session start
    interviewContextSnapshot: {
      type: interviewContextSnapshotSchema,
      default: null,
    },

    progress: {
      type: progressSchema,
      default: () => ({}),
    },

    processing: {
      type: processingSchema,
      default: () => ({}),
    },

    // Embedded final report — null until report is generated
    finalReport: {
      type: finalReportSchema,
      default: null,
    },

    startedAt:      { type: Date, default: null },
    completedAt:    { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Fast lookup of all sessions for a user, most recent first
interviewSessionSchema.index({ userId: 1, createdAt: -1 });
// Fast lookup of active sessions for a user
interviewSessionSchema.index({ userId: 1, status: 1 });
// Most recently active sessions for history feed
interviewSessionSchema.index({ userId: 1, lastActivityAt: -1 });

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

module.exports = InterviewSession;
