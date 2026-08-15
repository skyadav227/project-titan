/**
 * devEchoProvider.js
 *
 * Development-only speech provider.
 *
 * This provider does NOT pretend transcription succeeded.
 * It returns a clearly-marked unavailable result so the pipeline continues
 * but the frontend knows no real transcription occurred.
 *
 * NEVER use this in production — set SPEECH_PROVIDER=openai in production.
 *
 * Per constraint #5: "If no STT provider is configured during development,
 * provide a controlled development fallback that does NOT pretend
 * transcription succeeded."
 */
"use strict";

/**
 * Development echo transcription.
 * Returns a controlled "unavailable" result — never a fake successful transcript.
 *
 * @param {string} _audioPath - Ignored in dev mode
 * @param {string} _mimeType  - Ignored in dev mode
 * @returns {Promise<object>} Transcription result with unavailable flag
 */
async function transcribe(_audioPath, _mimeType) {
  console.warn("[devEchoProvider] DEV MODE: Real STT not configured. Set SPEECH_PROVIDER=openai for production.");
  return {
    text:        "",
    language:    "en",
    confidence:  null,
    provider:    "dev_echo",
    model:       "none",
    available:   false, // signals to speech service that transcription was not performed
    devMode:     true,
  };
}

module.exports = { transcribe };
