/**
 * speechService.js
 *
 * Application-level speech-to-text interface.
 * Interview services call this — never a provider directly.
 *
 * Architecture (per interview-architecture.md §25, constraint #5):
 *   Interview Service → Speech Service → Provider Adapter → STT Provider
 *
 * The provider is selected by the SPEECH_PROVIDER env variable.
 * Adding a new provider = adding a new file in providers/ and a case here.
 *
 * After transcription, this service also computes all deterministic speech
 * metrics from the transcript text. AI never fabricates these values.
 *
 * Per interview-api.md §27–28, interview-backend-spec.md §27–28.
 */
"use strict";

const { SPEECH_PROVIDER } = require("../../config/env");
const { resolveStoragePath, deleteStoredFile } = require("../../utils/fileUtils");

// ── Filler word dictionary ────────────────────────────────────────────────────
// Per interview-api.md §28 — should be configurable; defined here for V1.
const FILLER_WORDS = new Set([
  "um", "uh", "uhh", "umm", "er", "err",
  "like", "basically", "actually", "you know",
  "i mean", "right", "okay", "so", "well",
  "kind of", "sort of", "literally",
]);

// ── Provider loader ───────────────────────────────────────────────────────────

function getProvider() {
  const p = (SPEECH_PROVIDER || "dev_echo").toLowerCase();
  if (p === "openai") {
    return require("./providers/openAiWhisperProvider");
  }
  if (p === "dev_echo") {
    return require("./providers/devEchoProvider");
  }
  throw new Error(`Unknown SPEECH_PROVIDER: "${p}". Check your .env file.`);
}

// ── Transcription ─────────────────────────────────────────────────────────────

/**
 * Transcribe audio from a stored reference.
 *
 * @param {string} storageReference - UUID filename stored in the database
 * @param {string} mimeType         - Audio MIME type
 * @returns {Promise<object>} Transcription result
 */
async function transcribeAudio(storageReference, mimeType) {
  const provider  = getProvider();
  const audioPath = resolveStoragePath(storageReference);
  return provider.transcribe(audioPath, mimeType);
}

// ── Deterministic speech metrics ──────────────────────────────────────────────
//
// These are NEVER fabricated. If a value cannot be calculated from the
// actual transcript, it is returned as null.
// Per interview-api.md §27, constraint #11.

/**
 * Compute deterministic speech metrics from transcript and audio metadata.
 *
 * @param {object} params
 * @param {string}      params.transcript     - Transcript text
 * @param {number|null} params.durationMs     - Recording duration in ms (from client)
 * @param {number|null} params.audioDurationMs - Duration from STT provider (preferred)
 * @returns {object} Speech metrics — unavailable values are null
 */
function computeSpeechMetrics({ transcript, durationMs, audioDurationMs }) {
  const text = (transcript || "").trim();

  if (!text) {
    // No transcript — all metrics unavailable
    return {
      wordCount:            null,
      sentenceCount:        null,
      speakingRate:         null,
      fillerWordCount:      null,
      fillerWordRate:       null,
      fillerWordOccurrences:[],
      responseDurationMs:   audioDurationMs ?? durationMs ?? null,
      pauseCount:           null,
      totalPauseDurationMs: null,
    };
  }

  // Word count
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Sentence count (rough heuristic)
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;

  // Filler word detection
  const lowerText = text.toLowerCase();
  const fillerOccurrences = {};
  for (const filler of FILLER_WORDS) {
    // Escape regex special chars in filler phrase
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      fillerOccurrences[filler] = matches.length;
    }
  }

  const fillerWordCount = Object.values(fillerOccurrences).reduce((a, b) => a + b, 0);
  const fillerWordRate  = wordCount > 0 ? Math.round((fillerWordCount / wordCount) * 100 * 100) / 100 : null;

  // Speaking rate (words per minute) — requires a duration
  const effectiveDurationMs = audioDurationMs ?? durationMs ?? null;
  let speakingRate = null;
  if (effectiveDurationMs !== null && effectiveDurationMs > 0) {
    const minutes = effectiveDurationMs / 60000;
    speakingRate = Math.round(wordCount / minutes);
  }

  // Pause count / duration — not calculable from transcript alone (null)
  // Would require audio waveform analysis which is out of V1 scope
  return {
    wordCount,
    sentenceCount,
    speakingRate,
    fillerWordCount,
    fillerWordRate,
    fillerWordOccurrences: Object.entries(fillerOccurrences).map(([word, count]) => ({ word, count })),
    responseDurationMs:    effectiveDurationMs,
    pauseCount:            null,
    totalPauseDurationMs:  null,
  };
}

/**
 * Delete audio from storage after transcription is complete.
 * Per V1 policy: raw audio is not retained after processing.
 *
 * @param {string} storageReference
 */
function deleteAudioAfterProcessing(storageReference) {
  if (storageReference) {
    deleteStoredFile(storageReference);
    console.log(`[speechService] Deleted audio after processing: ${storageReference}`);
  }
}

module.exports = {
  transcribeAudio,
  computeSpeechMetrics,
  deleteAudioAfterProcessing,
};
