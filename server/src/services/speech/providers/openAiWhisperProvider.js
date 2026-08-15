/**
 * openAiWhisperProvider.js
 *
 * OpenAI Whisper speech-to-text provider.
 * This is the ONLY file that knows about the OpenAI Whisper API.
 *
 * Used when SPEECH_PROVIDER=openai.
 * Requires OPENAI_API_KEY to be set in environment.
 *
 * Per interview-architecture.md §25–26, constraint #5.
 */
"use strict";

const fs   = require("fs");
const path = require("path");
const { OPENAI_API_KEY, SPEECH_MODEL } = require("../../../config/env");

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * Transcribe audio using OpenAI Whisper.
 *
 * @param {string} audioPath - Absolute path to the audio file
 * @param {string} mimeType  - Audio MIME type
 * @returns {Promise<object>} Transcription result
 */
async function transcribe(audioPath, mimeType) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "your_openai_api_key_here") {
    const err = new Error("OpenAI API key is not configured. Set OPENAI_API_KEY in .env.");
    err.code = "SPEECH_CONFIG_ERROR";
    throw err;
  }

  const fileName = path.basename(audioPath);

  // Build multipart/form-data manually — no form-data package dependency needed
  const fileBuffer = fs.readFileSync(audioPath);
  const boundary   = `----TitanBoundary${Date.now()}`;

  const parts = [];

  // File part
  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  parts.push(fileBuffer);
  parts.push(`\r\n--${boundary}\r\n`);

  // model part
  parts.push(
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `${SPEECH_MODEL || "whisper-1"}\r\n`
  );

  // response_format part
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`
  );

  parts.push(`--${boundary}--\r\n`);

  const bodyParts = parts.map(p => (typeof p === "string" ? Buffer.from(p, "utf8") : p));
  const body = Buffer.concat(bodyParts);

  let response;
  try {
    response = await fetch(WHISPER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type":  `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });
  } catch (netErr) {
    console.error("[openAiWhisperProvider] Network error:", netErr.message);
    const err = new Error("Could not reach speech-to-text provider. Please try again.");
    err.code = "SPEECH_NETWORK_ERROR";
    throw err;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[openAiWhisperProvider] HTTP ${response.status}:`, text.slice(0, 200));
    const err = new Error(`Speech provider returned HTTP ${response.status}.`);
    err.code   = "SPEECH_PROVIDER_ERROR";
    err.status = response.status;
    throw err;
  }

  const json = await response.json();

  const transcript = json?.text || "";
  if (!transcript.trim()) {
    // Empty transcript is valid (e.g. silence) — not an error
    console.warn("[openAiWhisperProvider] Empty transcript returned — possibly silent audio.");
  }

  return {
    text:       transcript.trim(),
    language:   json?.language || "en",
    confidence: null,   // verbose_json doesn't expose a single confidence score
    provider:   "openai",
    model:      SPEECH_MODEL || "whisper-1",
    available:  true,
    segments:   json?.segments || [],
  };
}

module.exports = { transcribe };
