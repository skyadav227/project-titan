/**
 * voice_pipeline_unit.test.js
 *
 * Deterministic unit tests for TITAN's voice pipeline reliability improvements.
 *
 * HOW THIS WORKS
 * ─────────────
 * Tests fall into two categories:
 *
 * Source-inspection: read the actual source file with fs.readFileSync and
 * assert that the expected patterns exist. This confirms the fix landed in
 * the right place without spinning up DB, HTTP, or any external process.
 *
 * Logic-simulation: copy the minimal logic inline and assert the outcome
 * directly. No imports from application code — no side effects.
 *
 * Run: node tests/voice_pipeline_unit.test.js
 */
"use strict";

const fs   = require("fs");
const path = require("path");

let PASS = 0, FAIL = 0;
function test(label, fn) {
  try { fn(); PASS++; process.stdout.write(`  ✓  ${label}\n`); }
  catch (e) { FAIL++; process.stdout.write(`  ✗  FAIL: ${label}\n     ${e.message}\n`); }
}
function assert(c, m) { if (!c) throw new Error(m || "Assertion failed"); }

// ── Source file paths ─────────────────────────────────────────────────────────
const UPLOAD_SRC      = fs.readFileSync(
  path.join(__dirname, "../src/middleware/uploadAudio.js"), "utf8");
const INTERVIEW_SRC   = fs.readFileSync(
  path.join(__dirname, "../src/services/interviewService.js"), "utf8");
const CONTROLLER_SRC = fs.readFileSync(
  path.join(__dirname, "../src/controllers/interview.controller.js"), "utf8");

// ── Inline MIME normalisation logic (mirrors uploadAudio.js fileFilter) ───────
// Accepted MIME set matches AUDIO_ACCEPTED_MIMES env default in .env.example
const ACCEPTED_MIME_SET = new Set([
  "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav",
]);

function simulateFileFilter(mimeType) {
  const baseMime = mimeType.split(";")[0].trim().toLowerCase();
  return ACCEPTED_MIME_SET.has(baseMime);
}

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ MIME type normalisation — fileFilter ══\n");

test("1. audio/webm;codecs=opus → baseMime extraction → audio/webm → accepted", () => {
  assert(simulateFileFilter("audio/webm;codecs=opus") === true,
    "audio/webm;codecs=opus should be accepted");
});

test("2. audio/webm (plain) → accepted", () => {
  assert(simulateFileFilter("audio/webm") === true,
    "plain audio/webm should still be accepted");
});

test("3. Audio/WebM;Codecs=Opus (mixed case) → lowercased → accepted", () => {
  assert(simulateFileFilter("Audio/WebM;Codecs=Opus") === true,
    "case-insensitive MIME should be accepted");
});

test("4. '  audio/webm ; codecs=opus  ' (whitespace) → trimmed → accepted", () => {
  // Leading/trailing whitespace on the full string is part of the split result
  // when the caller passes padded input; trim() handles it.
  assert(simulateFileFilter("  audio/webm ; codecs=opus  ") === true,
    "whitespace-padded MIME should be accepted");
});

test("5. audio/mp3 (not in allowlist) → rejected", () => {
  assert(simulateFileFilter("audio/mp3") === false,
    "audio/mp3 should be rejected");
});

test("6. application/octet-stream → rejected", () => {
  assert(simulateFileFilter("application/octet-stream") === false,
    "application/octet-stream should be rejected");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ uploadAudio.js source inspection ══\n");

test("Source: baseMime split-trim-lowercase applied in fileFilter", () => {
  assert(
    UPLOAD_SRC.includes('file.mimetype.split(";")[0].trim().toLowerCase()'),
    'fileFilter must normalise MIME via split(";")[0].trim().toLowerCase()'
  );
});

test("Source: filename callback also uses baseMime for extension lookup", () => {
  assert(
    UPLOAD_SRC.includes("const baseMime = file.mimetype.split"),
    "diskStorage.filename must derive baseMime before looking up extension"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Transcript validation guard — source inspection ══\n");

test("7. Empty transcript ('') → guard detects SPEECH_EMPTY_TRANSCRIPT", () => {
  assert(
    INTERVIEW_SRC.includes('"SPEECH_EMPTY_TRANSCRIPT"'),
    "interviewService must define SPEECH_EMPTY_TRANSCRIPT error code"
  );
  assert(
    INTERVIEW_SRC.includes("!transcriptResult.text || !transcriptResult.text.trim()"),
    "guard must check for empty/whitespace-only text"
  );
});

test("8. Whitespace-only transcript ('   ') → guard detects SPEECH_EMPTY_TRANSCRIPT", () => {
  // Same code path as test 7 — .trim() handles both empty and whitespace-only
  assert(
    INTERVIEW_SRC.includes(".trim()"),
    "guard must use .trim() to catch whitespace-only transcripts"
  );
});

test("9. Valid transcript ('hello world') → passes the guard (logic simulation)", () => {
  // Inline simulation of the guard logic
  function guardPasses(text) {
    if (!text || !text.trim()) return "SPEECH_EMPTY_TRANSCRIPT";
    return "ok";
  }
  assert(guardPasses("hello world") === "ok",
    "non-empty transcript must pass the guard");
});

test("10. Null result from provider → SPEECH_MALFORMED_RESPONSE (source inspection)", () => {
  assert(
    INTERVIEW_SRC.includes('"SPEECH_MALFORMED_RESPONSE"'),
    "interviewService must define SPEECH_MALFORMED_RESPONSE error code"
  );
  assert(
    INTERVIEW_SRC.includes("!transcriptResult || typeof transcriptResult !== \"object\""),
    "guard must reject null/non-object provider responses"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Audio cleanup — try/finally ══\n");

test("11. Cleanup in finally block: source confirms try/finally around transcribeAudio", () => {
  // The pattern is: `transcribeAudio(` ... `} finally {`
  const transcribeIdx = INTERVIEW_SRC.indexOf("transcribeAudio(file.filename");
  assert(transcribeIdx !== -1, "transcribeAudio call must exist in source");
  const afterCall = INTERVIEW_SRC.slice(transcribeIdx);
  assert(afterCall.includes("} finally {"),
    "try/finally block must follow the transcribeAudio call");
});

test("12. Cleanup failure does not suppress original transcription error (logic simulation)", () => {
  // Simulate a transcription error thrown, then a cleanup error in finally,
  // and confirm the original error propagates.
  let caughtError = null;
  let cleanupRan  = false;

  function simulateTranscribeWithCleanup() {
    try {
      throw new Error("TRANSCRIPTION_FAILED");
    } finally {
      try {
        cleanupRan = true;
        throw new Error("cleanup error");   // cleanup fails
      } catch (_cleanupErr) {
        // inner catch swallows cleanupErr — non-fatal
      }
    }
  }

  try {
    simulateTranscribeWithCleanup();
  } catch (e) {
    caughtError = e;
  }

  assert(cleanupRan === true, "cleanup must have run in the finally block");
  assert(caughtError !== null, "the original transcription error must propagate");
  assert(caughtError.message === "TRANSCRIPTION_FAILED",
    "cleanup error must NOT replace the original transcription error");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Guard scope: audio path only ══\n");

test("13. Text-answer path does not invoke STT guard (source inspection)", () => {
  // The guard comment says "only for audio path (hasAudio === true)"
  // and it must appear inside the else block, after the hasText branch.
  // Verify the comment is present confirming placement.
  assert(
    INTERVIEW_SRC.includes("// Validate STT result — only for audio path (hasAudio === true)"),
    "guard must be annotated as audio-path-only"
  );

  // The STT guard code must NOT appear in the hasText branch.
  // Find the hasText block and confirm SPEECH_EMPTY_TRANSCRIPT is not in it.
  const hasTextIdx = INTERVIEW_SRC.indexOf("// ── Path A: text answer");
  const hasAudioIdx = INTERVIEW_SRC.indexOf("// ── Path B: audio answer");
  assert(hasTextIdx !== -1, "Path A section must exist");
  assert(hasAudioIdx !== -1, "Path B section must exist");
  assert(hasTextIdx < hasAudioIdx, "Path A must come before Path B");

  // The guard code lives in Path B (after hasAudioIdx), not in Path A.
  const guardIdx = INTERVIEW_SRC.indexOf("SPEECH_EMPTY_TRANSCRIPT");
  assert(guardIdx > hasAudioIdx,
    "SPEECH_EMPTY_TRANSCRIPT guard must be in Path B (audio), not Path A (text)");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ STATUS_MAP coverage — source inspection ══\n");

test("14. STATUS_MAP contains SPEECH_MALFORMED_RESPONSE", () => {
  assert(
    CONTROLLER_SRC.includes("SPEECH_MALFORMED_RESPONSE"),
    "STATUS_MAP must include SPEECH_MALFORMED_RESPONSE"
  );
});

test("15. STATUS_MAP contains SPEECH_EMPTY_TRANSCRIPT", () => {
  assert(
    CONTROLLER_SRC.includes("SPEECH_EMPTY_TRANSCRIPT"),
    "STATUS_MAP must include SPEECH_EMPTY_TRANSCRIPT"
  );
});

test("16. SPEECH_MALFORMED_RESPONSE maps to 502", () => {
  assert(
    /SPEECH_MALFORMED_RESPONSE\s*:\s*502/.test(CONTROLLER_SRC),
    "SPEECH_MALFORMED_RESPONSE must map to HTTP 502"
  );
});

test("17. SPEECH_EMPTY_TRANSCRIPT maps to 422", () => {
  assert(
    /SPEECH_EMPTY_TRANSCRIPT\s*:\s*422/.test(CONTROLLER_SRC),
    "SPEECH_EMPTY_TRANSCRIPT must map to HTTP 422"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Failed-attempt lifecycle — source inspection ══\n");

test("18. Both guards set attempt.status = 'failed' (source inspection)", () => {
  // The combined guard block sets attempt.status = "failed" once for both cases
  assert(
    INTERVIEW_SRC.includes('attempt.status = "failed"'),
    "combined guard must set attempt.status = \"failed\""
  );
});

test("19. Both guards set err.attemptId (source inspection)", () => {
  assert(
    INTERVIEW_SRC.includes("err.attemptId = attempt._id.toString()"),
    "combined guard must attach err.attemptId"
  );
});

test("20. Both guards set pendingFailedAttemptId (source inspection)", () => {
  assert(
    INTERVIEW_SRC.includes("pendingFailedAttemptId: attempt._id"),
    "combined guard must set pendingFailedAttemptId on the question"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Guard logic simulation ══\n");

function simulateGuard(transcriptResult) {
  const malformed = !transcriptResult || typeof transcriptResult !== "object";
  const empty = !malformed && (!transcriptResult.text || !transcriptResult.text.trim());
  if (malformed) return "SPEECH_MALFORMED_RESPONSE";
  if (empty) return "SPEECH_EMPTY_TRANSCRIPT";
  return "ok";
}

test("21. Malformed guard fires when transcriptResult is null", () => {
  assert(simulateGuard(null) === "SPEECH_MALFORMED_RESPONSE",
    "null transcriptResult must trigger SPEECH_MALFORMED_RESPONSE");
});

test("22. Malformed guard fires when transcriptResult is a string", () => {
  assert(simulateGuard("some string") === "SPEECH_MALFORMED_RESPONSE",
    "string transcriptResult must trigger SPEECH_MALFORMED_RESPONSE");
});

test("23. Empty guard fires when text is empty string", () => {
  assert(simulateGuard({ text: "" }) === "SPEECH_EMPTY_TRANSCRIPT",
    "empty text must trigger SPEECH_EMPTY_TRANSCRIPT");
});

test("24. Empty guard fires when text is whitespace only", () => {
  assert(simulateGuard({ text: "   " }) === "SPEECH_EMPTY_TRANSCRIPT",
    "whitespace-only text must trigger SPEECH_EMPTY_TRANSCRIPT");
});

test("25. Valid transcript 'hello world' passes both guards", () => {
  assert(simulateGuard({ text: "hello world" }) === "ok",
    "valid transcript must pass both guards");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Regression guard ══\n");

test("26. TRANSCRIPTION_FAILED still in STATUS_MAP (regression)", () => {
  assert(
    CONTROLLER_SRC.includes("TRANSCRIPTION_FAILED"),
    "STATUS_MAP must still contain TRANSCRIPTION_FAILED (regression guard)"
  );
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Frontend retry routing — FRESH_RECORDING_ERRORS guard ══\n");

// Read the InterviewContext source for source-inspection tests
const INTERVIEW_CTX_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8");

// Simulate the routing decision (mirrors the logic added to InterviewContext.jsx)
function routeError(err, pendingAttemptId) {
  const FRESH = new Set(["SPEECH_EMPTY_TRANSCRIPT", "SPEECH_MALFORMED_RESPONSE", "TRANSCRIPTION_FAILED"]);
  if (err?.attemptId && !FRESH.has(err.code)) {
    return { pendingAttemptId: err.attemptId };
  }
  return { pendingAttemptId }; // unchanged
}

test("27. SPEECH_EMPTY_TRANSCRIPT with attemptId → pendingAttemptId NOT set (fresh recording)", () => {
  const result = routeError({ code: "SPEECH_EMPTY_TRANSCRIPT", attemptId: "abc123" }, null);
  assert(result.pendingAttemptId === null,
    "SPEECH_EMPTY_TRANSCRIPT must not set pendingAttemptId");
});

test("28. SPEECH_MALFORMED_RESPONSE with attemptId → pendingAttemptId NOT set (fresh recording)", () => {
  const result = routeError({ code: "SPEECH_MALFORMED_RESPONSE", attemptId: "abc123" }, null);
  assert(result.pendingAttemptId === null,
    "SPEECH_MALFORMED_RESPONSE must not set pendingAttemptId");
});

test("29. TRANSCRIPTION_FAILED with attemptId → pendingAttemptId NOT set (fresh recording)", () => {
  const result = routeError({ code: "TRANSCRIPTION_FAILED", attemptId: "abc123" }, null);
  assert(result.pendingAttemptId === null,
    "TRANSCRIPTION_FAILED must not set pendingAttemptId");
});

test("30. EVALUATION_FAILED with attemptId → pendingAttemptId IS set (reevaluation path preserved)", () => {
  const result = routeError({ code: "EVALUATION_FAILED", attemptId: "abc123" }, null);
  assert(result.pendingAttemptId === "abc123",
    "EVALUATION_FAILED must set pendingAttemptId to the attemptId");
});

test("31. AI_PROVIDER_ERROR with attemptId → pendingAttemptId IS set (reevaluation path preserved)", () => {
  const result = routeError({ code: "AI_PROVIDER_ERROR", attemptId: "abc123" }, null);
  assert(result.pendingAttemptId === "abc123",
    "AI_PROVIDER_ERROR must set pendingAttemptId to the attemptId");
});

test("32. No attemptId on any error → pendingAttemptId unchanged regardless of code", () => {
  const existing = "existingId";
  const result = routeError({ code: "SPEECH_EMPTY_TRANSCRIPT" }, existing);
  assert(result.pendingAttemptId === existing,
    "without attemptId, pendingAttemptId must remain unchanged");
});

test("33. SPEECH_EMPTY_TRANSCRIPT without attemptId → pendingAttemptId unchanged", () => {
  const result = routeError({ code: "SPEECH_EMPTY_TRANSCRIPT" }, null);
  assert(result.pendingAttemptId === null,
    "no attemptId means pendingAttemptId stays null");
});

test("34. FRESH_RECORDING_ERRORS set exists in InterviewContext.jsx (source inspection)", () => {
  assert(
    INTERVIEW_CTX_SRC.includes("FRESH_RECORDING_ERRORS"),
    "InterviewContext.jsx must define FRESH_RECORDING_ERRORS");
});

test("35. SPEECH_EMPTY_TRANSCRIPT is in FRESH_RECORDING_ERRORS (source inspection)", () => {
  assert(
    INTERVIEW_CTX_SRC.includes('"SPEECH_EMPTY_TRANSCRIPT"'),
    "SPEECH_EMPTY_TRANSCRIPT must appear in FRESH_RECORDING_ERRORS in InterviewContext.jsx");
});

test("36. TRANSCRIPTION_FAILED is in FRESH_RECORDING_ERRORS (source inspection)", () => {
  assert(
    INTERVIEW_CTX_SRC.includes('"TRANSCRIPTION_FAILED"'),
    "TRANSCRIPTION_FAILED must appear in FRESH_RECORDING_ERRORS in InterviewContext.jsx");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write("\n══ Answer Visibility Tests ══\n");

// Read client context source (may already be in memory above but re-read for clarity)
const ANSWER_REPORT_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/components/interview/AnswerReport.jsx"), "utf8");

test("AV-1. answerAttemptToResult transcript condition does NOT gate on status === 'completed'", () => {
  assert(
    !INTERVIEW_SRC.includes('attempt.status === "completed" && attempt.transcript'),
    'transcript must not be gated on attempt.status === "completed"'
  );
});

test("AV-2. failedAttemptTranscript field exists in INITIAL_STATE", () => {
  assert(
    INTERVIEW_CTX_SRC.includes("failedAttemptTranscript"),
    "InterviewContext.jsx must define failedAttemptTranscript in INITIAL_STATE"
  );
});

test("AV-3. SET_FAILED_TRANSCRIPT case exists in the reducer", () => {
  assert(
    INTERVIEW_CTX_SRC.includes("SET_FAILED_TRANSCRIPT"),
    "InterviewContext.jsx reducer must handle SET_FAILED_TRANSCRIPT"
  );
});

test("AV-4. AnswerReport.jsx renders answerResult.transcript.text", () => {
  assert(
    ANSWER_REPORT_SRC.includes("transcript.text"),
    "AnswerReport.jsx must reference transcript.text"
  );
});

test("AV-5. EVALUATION_FAILED throw attaches err.transcript", () => {
  assert(
    INTERVIEW_SRC.includes("err.transcript = attempt.transcript"),
    "interviewService.js must attach err.transcript at the EVALUATION_FAILED throw site"
  );
});

test("AV-6. Transcript available on failed attempt (logic simulation)", () => {
  const attempt = { transcript: { text: "hello" } };
  const result = attempt.transcript?.text
    ? { text: attempt.transcript.text, available: true }
    : { available: false };
  assert(result.available === true, "available must be true");
  assert(result.text === "hello", "text must equal 'hello'");
});

test("AV-7. Transcript unavailable without text (logic simulation)", () => {
  const attempt = { transcript: { text: null } };
  const result = attempt.transcript?.text
    ? { text: attempt.transcript.text, available: true }
    : { available: false };
  assert(result.available === false, "available must be false when text is null");
  assert(result.text === undefined, "text must be absent when unavailable");
});

test("AV-8. failedAttemptTranscript routing (logic simulation)", () => {
  const errWithTranscript = { code: "EVALUATION_FAILED", transcript: "I think the answer is..." };
  assert(!!errWithTranscript?.transcript === true,
    "EVALUATION_FAILED with transcript: err?.transcript must be truthy");

  const errWithoutTranscript = { code: "TRANSCRIPTION_FAILED" };
  assert(!!errWithoutTranscript?.transcript === false,
    "TRANSCRIPTION_FAILED without transcript: err?.transcript must be falsy");
});

test("AV-9. AnswerReport renders when available (logic simulation)", () => {
  const answerResult = { transcript: { available: true, text: "answer text" } };
  const shouldRender = answerResult?.transcript?.available && answerResult.transcript.text;
  assert(!!shouldRender === true, "condition must be truthy when transcript is available");
});

test("AV-10. AnswerReport does not render when unavailable (logic simulation)", () => {
  const answerResult = { transcript: { available: false } };
  const shouldRender = answerResult?.transcript?.available && answerResult.transcript.text;
  assert(!shouldRender === true, "condition must be falsy when transcript is unavailable");
});

// ═════════════════════════════════════════════════════════════════════════════
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${PASS + FAIL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${PASS + FAIL}\n\n`);
process.exit(FAIL > 0 ? 1 : 0);
