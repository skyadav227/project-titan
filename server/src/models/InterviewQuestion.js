/**
 * InterviewQuestion.js
 *
 * One logical interview question within a session.
 * Questions are separate documents because they are dynamically generated,
 * may depend on previous answers, form adaptive chains, and may have
 * multiple answer attempts.
 *
 * The `sequenceIndex` uniquely identifies chronological position (0-based).
 * The `questionNumber` is the user-facing 1-based number.
 *
 * Adaptive follow-ups are ordinary questions with:
 *   source = "adaptive_follow_up"
 *   parentQuestionId = previous question's _id
 *   generationContext.reason  (NEVER exposed to frontend)
 *
 * Per interview-data-model.md §10–13, §51.
 */
"use strict";

const mongoose = require("mongoose");

// ── AI generation metadata sub-schema ────────────────────────────────────────
const aiMetadataSchema = new mongoose.Schema(
  {
    provider:           { type: String, default: null },
    model:              { type: String, default: null },
    promptVersion:      { type: String, default: null },
    generationLatencyMs:{ type: Number, default: null },
    generatedAt:        { type: Date,   default: null },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────
const interviewQuestionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User-facing question number (1-based, monotonically increasing)
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // 0-based chronological position — must be unique within session
    sequenceIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "project",
        "resume",
        "company",
        "role",
        "job_description",
        "follow_up",
        "mixed",
        "system_design",
        "problem_solving",
        "scenario",
        "conceptual",
      ],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // "initial" = opening / planned question; "adaptive_follow_up" = generated from previous answer
    source: {
      type: String,
      enum: ["initial", "adaptive_follow_up"],
      required: true,
    },

    // Populated only for adaptive follow-ups
    parentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      default: null,
    },

    // Internal metadata — must NEVER be returned to the frontend
    generationContext: {
      previousQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        default: null,
      },
      previousAnswerAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnswerAttempt",
        default: null,
      },
      // e.g. "weak_area", "follow_up", "difficulty_increase" — internal only
      reason: { type: String, default: "" },
      topic:  { type: String, default: "" },
    },

    // Question lifecycle: generated → asked → answered | skipped
    status: {
      type: String,
      enum: ["generated", "asked", "answered", "skipped"],
      default: "generated",
    },

    // Populated with the primary (most recent successful) attempt for quick access
    latestAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnswerAttempt",
      default: null,
    },

    // Max retries allowed for this question (pulled from session config at creation time)
    maxRetries: {
      type: Number,
      default: 2,
      min: 0,
    },

    // How many retry attempts have been made (attempt 1 is the original, retries start at 2)
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    askedAt:    { type: Date, default: null },
    completedAt:{ type: Date, default: null },

    aiMetadata: {
      type: aiMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique chronological position within a session — prevents duplicates
interviewQuestionSchema.index(
  { sessionId: 1, sequenceIndex: 1 },
  { unique: true }
);

// Fast lookup of questions in order for a session
interviewQuestionSchema.index({ sessionId: 1, questionNumber: 1 });

// Ownership-scoped lookups
interviewQuestionSchema.index({ userId: 1, sessionId: 1 });

const InterviewQuestion = mongoose.model("InterviewQuestion", interviewQuestionSchema);

module.exports = InterviewQuestion;
