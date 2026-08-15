/**
 * strategyService.js
 *
 * Tracks and updates the adaptive interview strategy state.
 *
 * The strategy drives difficulty adaptation, topic coverage,
 * and weak/strong area detection — all of which feed the question engine.
 *
 * This is backend-owned state. The frontend never sees or modifies it.
 *
 * Per interview-backend-spec.md §11, interview-architecture.md §22.
 */
"use strict";

/**
 * Map difficulty string to numeric level (1–3 for V1 easy/medium/hard).
 */
const DIFFICULTY_TO_LEVEL = { easy: 1, medium: 2, hard: 3, adaptive: 2 };
const LEVEL_TO_DIFFICULTY = { 1: "easy", 2: "medium", 3: "hard" };

/**
 * Create the initial strategy state for a new session.
 *
 * @param {object} config - Session configuration
 * @returns {object} Strategy state
 */
function createInitialStrategy(config) {
  const initialLevel = DIFFICULTY_TO_LEVEL[config.difficulty] ?? 2;
  return {
    currentDifficulty:  config.difficulty === "adaptive" ? "medium" : config.difficulty,
    currentLevel:       initialLevel,
    targetLevel:        initialLevel,
    isAdaptive:         config.difficulty === "adaptive",

    coveredTopics:      [],   // topics already explored
    weakTopics:         [],   // topics with poor performance
    strongTopics:       [],   // topics with strong performance
    recentScores:       [],   // last N overall scores for trend detection
    consecutiveStrong:  0,    // consecutive strong answers
    consecutiveWeak:    0,    // consecutive weak answers

    questionsAnswered:  0,
    retryCount:         0,
    interviewStage:     "opening", // opening → core → closing
  };
}

/**
 * Update strategy state after an answer is evaluated.
 * Returns a new strategy object (immutable update pattern).
 *
 * @param {object} strategy - Current strategy state
 * @param {object} evaluation - Evaluation from answerAnalysis
 * @param {string} topic - Topic of the answered question
 * @returns {object} Updated strategy state
 */
function updateStrategy(strategy, evaluation, topic) {
  const score = evaluation?.overallScore ?? null;
  const classification = evaluation?.classification;

  const updated = { ...strategy };

  // Track topic coverage
  if (topic && !updated.coveredTopics.includes(topic)) {
    updated.coveredTopics = [...updated.coveredTopics, topic];
  }

  // Track weak/strong areas
  if (score !== null) {
    if (score >= 75) {
      updated.consecutiveStrong += 1;
      updated.consecutiveWeak   = 0;
      if (topic && !updated.strongTopics.includes(topic)) {
        updated.strongTopics = [...updated.strongTopics, topic];
      }
      // Remove from weak if it was there
      updated.weakTopics = updated.weakTopics.filter(t => t !== topic);
    } else if (score < 55 || classification === "incorrect" || classification === "insufficient") {
      updated.consecutiveWeak   += 1;
      updated.consecutiveStrong  = 0;
      if (topic && !updated.weakTopics.includes(topic)) {
        updated.weakTopics = [...updated.weakTopics, topic];
      }
    } else {
      // Partially correct / neutral — reset streaks
      updated.consecutiveStrong = 0;
      updated.consecutiveWeak   = 0;
    }

    // Keep last 5 scores for trend
    updated.recentScores = [...(updated.recentScores.slice(-4)), score];
  }

  updated.questionsAnswered += 1;

  // Adaptive difficulty adjustment (interview-backend-spec.md §19)
  if (updated.isAdaptive) {
    if (updated.consecutiveStrong >= 2 && updated.currentLevel < 3) {
      updated.currentLevel = Math.min(3, updated.currentLevel + 1);
      updated.currentDifficulty = LEVEL_TO_DIFFICULTY[updated.currentLevel];
      updated.consecutiveStrong = 0;
    } else if (updated.consecutiveWeak >= 2 && updated.currentLevel > 1) {
      updated.currentLevel = Math.max(1, updated.currentLevel - 1);
      updated.currentDifficulty = LEVEL_TO_DIFFICULTY[updated.currentLevel];
      updated.consecutiveWeak = 0;
    }
  }

  // Update interview stage
  if (updated.questionsAnswered === 1) {
    updated.interviewStage = "core";
  }

  return updated;
}

/**
 * Build the context summary the question engine needs about current strategy.
 * This is a compact subset — not the full strategy object.
 *
 * @param {object} strategy
 * @param {number} questionsRemaining
 * @returns {object}
 */
function getStrategyContext(strategy, questionsRemaining) {
  return {
    currentDifficulty:  strategy.currentDifficulty,
    coveredTopics:      strategy.coveredTopics.slice(-10),
    weakTopics:         strategy.weakTopics.slice(-5),
    strongTopics:       strategy.strongTopics.slice(-5),
    recentScores:       strategy.recentScores,
    questionsAnswered:  strategy.questionsAnswered,
    questionsRemaining,
    interviewStage:     strategy.interviewStage,
  };
}

module.exports = {
  createInitialStrategy,
  updateStrategy,
  getStrategyContext,
};
