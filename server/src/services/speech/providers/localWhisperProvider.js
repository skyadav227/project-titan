/**
 * localWhisperProvider.js
 *
 * Local speech-to-text provider for TITAN development.
 *
 * Node.js -> Python 3.11 -> faster-whisper
 *
 * No external STT API and no per-request STT charges.
 */

"use strict";

const path = require("path");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");

const PYTHON_PATH =
  process.env.SPEECH_PYTHON_PATH ||
  path.join(PROJECT_ROOT, "speech-env", "Scripts", "python.exe");

const TRANSCRIBE_SCRIPT =
  process.env.SPEECH_SCRIPT_PATH ||
  path.join(PROJECT_ROOT, "speech", "transcribe.py");

/**
 * Transcribe audio using local faster-whisper.
 *
 * @param {string} audioPath
 * @param {string} mimeType
 * @returns {Promise<object>}
 */
function transcribe(audioPath, mimeType) {
  return new Promise((resolve, reject) => {
    console.log("[localWhisperProvider] Starting local transcription...");
    console.log(`[localWhisperProvider] Python: ${PYTHON_PATH}`);
    console.log(`[localWhisperProvider] Audio: ${audioPath}`);

    const python = spawn(
      PYTHON_PATH,
      [TRANSCRIBE_SCRIPT, audioPath],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("error", (err) => {
      console.error(
        "[localWhisperProvider] Failed to start Python:",
        err.message
      );

      const error = new Error(
        "Could not start the local speech-to-text service."
      );

      error.code = "SPEECH_LOCAL_START_ERROR";

      reject(error);
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error(
          `[localWhisperProvider] Python exited with code ${code}`
        );

        if (stderr.trim()) {
          console.error("[localWhisperProvider] Python stderr:", stderr.trim());
        }

        const error = new Error(
          "Local speech-to-text processing failed."
        );

        error.code = "SPEECH_LOCAL_ERROR";
        reject(error);
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (result.error) {
          const error = new Error(result.error);
          error.code = "SPEECH_LOCAL_ERROR";
          reject(error);
          return;
        }

        console.log(
          `[localWhisperProvider] Transcription complete. Language: ${result.language}`
        );

        console.log(
          `[localWhisperProvider] Transcript: "${result.text}"`
        );

        resolve({
          text: result.text || "",
          language: result.language || "en",
          confidence: result.confidence ?? null,
          provider: "faster-whisper",
          model: result.model || "base.en",
          available: true,
        });
      } catch (parseError) {
        console.error(
          "[localWhisperProvider] Invalid Python response:",
          stdout
        );

        const error = new Error(
          "Local speech-to-text returned an invalid response."
        );

        error.code = "SPEECH_LOCAL_RESPONSE_ERROR";
        reject(error);
      }
    });
  });
}

module.exports = {
  transcribe,
};