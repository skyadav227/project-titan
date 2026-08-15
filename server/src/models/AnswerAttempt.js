/**
 * AnswerAttempt.js
 *
 * One actual answer submission for a question.
 *
 * Every retry creates a NEW AnswerAttempt — previous attempts are NEVER
 * overwritten. This is the foundation of TITAN's improvement measurement.
 *
 * Processing lifecycle: recording → uploaded → transcribing → analyzing → completed
 *                   OR: any → failed
 *
 * Two distinct concepts:
 *   - Processing retry: retry the same attempt's transcription/analysis
 *   - Answer retry: create a NEW AnswerAttempt (tracked separately)
 *
 * Audio binaries are stored externally (local disk in V1, object storage later).
 * MongoDB stores only metadata + a storage reference (UUID filename).
 *
 * Per interview-data-model.md §14–21, §30, §47, §52.
 */
"use strict";

const mongoose = require("mongoose");

// ── Answer analysis sub-schema ────────────────────────────────────────────────
// Stored as structured data — never as raw AI text that would need re-parsing.
// Per interview-data-model.md §16.
const fillerWordOccurrenceSchema = new mongoose.Schema(
  {
    word:  { type: String, required: true },
    count: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const correctionSchema = new mongoose.Schema(
  {
    original:    { type: String, required: true },
    improved:    { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const answerAnalysisSchema = new mongoose.Schema(
  {
    // Scores 0–100; null means the dimension was not evaluated
    overallScore:      { type: Number, min: 0, max: 100, default: null },
    technicalAccuracy: { type: Number, min: 0, max: 100, default: null },
    relevance:         { type: Number, min: 0, max: 100, default: null },
    communication:     { type: Number, min: 0, max: 100, default: null },
    clarity:           { type: Number, min: 0, max: 100, default: null },
    structure:         { type: Number, min: 0, max: 100, default: null },
    completeness:      { type: Number, min: 0, max: 100, default: null },
    problemSolving:    { type: Number, min: 0, max: 100, default: null },

    // Answer quality classification
    classification: {
      type: String,
      enum: ["correct", "mostly_correct", "partially_correct", "incorrect", "insufficient", "off_topic", null],
      default: null,
    },

    // Deterministic speech metrics (null = unavailable — never fabricated)
    speech: {
      responseDurationMs:   { type: Number, default: null },
      wordCount:            { type: Number, default: null },
      speakingRate:         { type: Number, default: null }, // words per minute
      pauseCount:           { type: Number, default: null },
      totalPauseDurationMs: { type: Number, default: null },
      fillerWordCount:      { type: Number, default: null },
      fillerWordRate:       { type: Number, default: null }, // fillers per 100 words
      sentenceCount:        { type: Number, default: null },
    },

    fillerWords: {
      total:       { type: Number, default: 0, min: 0 },
      occurrences: { type: [fillerWordOccurrenceSchema], default: [] },
    },

    language: {
      sentenceQuality:      { type: Number, min: 0, max: 100, default: null },
      grammarIssues:        { type: Number, default: 0, min: 0 },
      incompleteSentences:  { type: Number, default: 0, min: 0 },
    },

    // Structured feedback arrays
    strengths:    { type: [String], default: [] },
    weaknesses:   { type: [String], default: [] },
    suggestions:  { type: [String], default: [] },
    missingPoints:{ type: [String], default: [] },
    corrections:  { type: [correctionSchema], default: [] },

    technicalFeedback: {
      correctness:        { type: String, default: "" },
      missingConcepts:    { type: [String], default: [] },
      misconceptions:     { type: [String], default: [] },
      improvedExplanation:{ type: String, default: "" },
    },

    communicationFeedback: {
      observations: { type: [String], default: [] },
      suggestions:  { type: [String], default: [] },
    },

    // Whether AI / backend recommends retry / explanation
    retryRecommended:       { type: Boolean, default: false },
    explanationRecommended: { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Improvement comparison sub-schema ─────────────────────────────────────────
// Calculated only after a retry attempt has been analyzed.
// All deltas are from persisted evaluation data — never fabricated.
const improvementSchema = new mongoose.Schema(
  {
    previousAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnswerAttempt",
      default: null,
    },
    scoreDelta:         { type: Number, default: null },
    communicationDelta: { type: Number, default: null },
    technicalDelta:     { type: Number, default: null },
    structureDelta:     { type: Number, default: null },
    improved:           { type: Boolean, default: null },
    improvedAreas:      { type: [String], default: [] },
    remainingIssues:    { type: [String], default: [] },
  },
  { _id: false }
);

// ── Explanation sub-schema ────────────────────────────────────────────────────
const explanationSchema = new mongoose.Schema(
  {
    requested:   { type: Boolean, default: false },
    topic:       { type: String, default: "" },
    trigger: {
      type: String,
      enum: ["user_request", "system_suggestion", null],
      default: null,
    },
    explanationText: { type: String, default: "" },
    keyPoints:       { type: [String], default: [] },
    relatedQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      default: null,
    },
    createdAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── AI metadata sub-schema ────────────────────────────────────────────────────
// Internal — not exposed to frontend. Used for debugging, cost tracking,
// model comparison, and ensuring historical AI version reproducibility.
const aiMetadataSchema = new mongoose.Schema(
  {
    provider:        { type: String, default: null },
    model:           { type: String, default: null },
    promptVersion:   { type: String, default: null },
    analysisVersion: { type: String, default: null },
    latencyMs:       { type: Number, default: null },
    tokenUsage: {
      input:  { type: Number, default: null },
      output: { type: Number, default: null },
      total:  { type: Number, default: null },
    },
    generatedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────
const answerAttemptSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Attempt number within the question (1 = original, 2+ = retries)
    // Unique within a question — enforced by compound unique index below.
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // true for attempts 2+
    isRetry: {
      type: Boolean,
      default: false,
    },

    // Answer attempt processing lifecycle
    status: {
      type: String,
      enum: ["recording", "uploaded", "transcribing", "analyzing", "completed", "failed"],
      default: "recording",
    },

    // Processing operation tracking for idempotency + recovery
    processing: {
      operationId:    { type: String, default: null },
      errorCode:      { type: String, default: null },
      errorMessage:   { type: String, default: null },
      retryable:      { type: Boolean, default: false },
      attempts:       { type: Number, default: 0, min: 0 },
      lastProcessedAt:{ type: Date, default: null },
    },

    // Audio metadata — binaries stored externally, never in MongoDB
    audio: {
      storageReference: { type: String, default: null }, // UUID filename on disk/object-storage
      mimeType:         { type: String, default: null },
      durationMs:       { type: Number, default: null, min: 0 },
      sizeBytes:        { type: Number, default: null, min: 0 },
      uploadedAt:       { type: Date,   default: null },
      deleted:          { type: Boolean, default: false }, // true after post-processing cleanup
    },

    // Transcript from speech-to-text provider
    transcript: {
      text:        { type: String, default: "" },
      language:    { type: String, default: "en" },
      confidence:  { type: Number, min: 0, max: 1, default: null },
      provider:    { type: String, default: null },
      model:       { type: String, default: null },
      generatedAt: { type: Date, default: null },
    },

    // Structured AI + deterministic analysis
    // Stored as Mixed so the sub-schema validates on write via service layer,
    // not at Mongoose level — avoids mixed-schema rigidity for evolving AI output.
    // The answerAnalysisSchema above documents the expected shape.
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // High-level quality classification (duplicated from analysis for fast querying)
    answerQuality: {
      type: String,
      enum: ["excellent", "good", "mostly_correct", "partially_correct", "incorrect", "insufficient", null],
      default: null,
    },

    // Retry improvement — populated after this retry has been evaluated
    improvement: {
      type: improvementSchema,
      default: () => ({}),
    },

    // Explanation linked to this answer context
    explanation: {
      type: explanationSchema,
      default: () => ({}),
    },

    aiMetadata: {
      type: aiMetadataSchema,
      default: () => ({}),
    },

    // Client-provided idempotency key to prevent duplicate submissions
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },

    submittedAt:  { type: Date, default: null },
    completedAt:  { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique attempt per question — prevents duplicate submissions
// (interview-data-model.md §42)
answerAttemptSchema.index(
  { questionId: 1, attemptNumber: 1 },
  { unique: true }
);

// All attempts for a session in chronological order
answerAttemptSchema.index({ sessionId: 1, createdAt: 1 });

// Ownership-scoped history lookups
answerAttemptSchema.index({ userId: 1, createdAt: -1 });

// Fast lookup by question with all attempts for that question
answerAttemptSchema.index({ questionId: 1, createdAt: 1 });

const AnswerAttempt = mongoose.model("AnswerAttempt", answerAttemptSchema);

module.exports = AnswerAttempt;
