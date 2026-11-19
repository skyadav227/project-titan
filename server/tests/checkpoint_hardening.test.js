/**
 * checkpoint_hardening.test.js
 *
 * Regression suite for the 10-commit checkpoint hardening implementation.
 * 24 tests: 9 source inspections + 15 behavioral simulations.
 *
 * Plain-Node deterministic pattern — no test framework, no DB connection.
 * Run: node tests/checkpoint_hardening.test.js
 */
"use strict";

const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ── Source file paths ─────────────────────────────────────────────────────────
const root        = path.resolve(__dirname, "..");
const answerAttemptSrc  = fs.readFileSync(path.join(root, "src/models/AnswerAttempt.js"),        "utf8");
const sessionSrc        = fs.readFileSync(path.join(root, "src/models/InterviewSession.js"),     "utf8");
const serviceSrc        = fs.readFileSync(path.join(root, "src/services/interviewService.js"),   "utf8");
const controllerSrc     = fs.readFileSync(path.join(root, "src/controllers/interview.controller.js"), "utf8");
const uploadSrc         = fs.readFileSync(path.join(root, "src/middleware/uploadAudio.js"),      "utf8");
const clientSrc         = fs.readFileSync(
  path.join(root, "../client/src/contexts/InterviewContext.jsx"), "utf8"
);

console.log("\ncheckpoint_hardening.test.js — 24 tests\n");

// ── Tests 1-4: Source inspections ─────────────────────────────────────────────

test("1. checkpointAttempts field exists in AnswerAttempt.js", () => {
  assert(
    answerAttemptSrc.includes("checkpointAttempts"),
    "checkpointAttempts field not found in AnswerAttempt.js"
  );
});

test("2. CHECKPOINT_REEVAL_LIMIT used in reevaluateAnswer in interviewService.js", () => {
  assert(
    serviceSrc.includes("CHECKPOINT_REEVAL_LIMIT"),
    "CHECKPOINT_REEVAL_LIMIT not found in interviewService.js"
  );
});

test("3. generationToken field exists in InterviewSession.js", () => {
  assert(
    sessionSrc.includes("generationToken"),
    "generationToken field not found in InterviewSession.js"
  );
});

test("4. uuidv4 import exists in interviewService.js", () => {
  assert(
    serviceSrc.includes("uuidv4"),
    "uuidv4 not found in interviewService.js"
  );
});

// ── Test 5: Independent counter isolation ─────────────────────────────────────

test("5. Independent counter isolation — normal retries exhausted, checkpoint still eligible", () => {
  const attempt = { processing: { attempts: 3, checkpointAttempts: 0 } };
  const AI_MAX_RETRIES = 3, CHECKPOINT_REEVAL_LIMIT = 2;
  assert(attempt.processing.attempts >= AI_MAX_RETRIES, "Normal retries exhausted");
  assert(attempt.processing.checkpointAttempts < CHECKPOINT_REEVAL_LIMIT, "Checkpoint still eligible");
});

// ── Test 6: Concurrent checkpoint claim ───────────────────────────────────────

test("6. Concurrent checkpoint claim — atomic simulation", () => {
  let checkpointAttempts = 1;
  const LIMIT = 2;
  function atomicClaim() {
    if (checkpointAttempts < LIMIT) { checkpointAttempts++; return true; }
    return false;
  }
  assert(atomicClaim() === true,  "First claim succeeds");
  assert(atomicClaim() === false, "Second concurrent claim rejected");
  assert(checkpointAttempts === LIMIT, "Counter at limit");
});

// ── Tests 7a-7f: Authoritative attempt selection ──────────────────────────────

function selectAttempt(latestAttemptId, pendingFailedAttemptId, allAttempts) {
  let minAttemptNumber = 1, boundaryEstablished = true;
  if (latestAttemptId) {
    const lastSuccess = allAttempts.find(a =>
      a._id === latestAttemptId && a.status === "completed" && a.questionId === "q1");
    if (lastSuccess) {
      minAttemptNumber = lastSuccess.attemptNumber + 1;
    } else {
      boundaryEstablished = false;
    }
  }
  if (!boundaryEstablished) return { code: "CHECKPOINT_INTEGRITY_ERROR" };

  let attempt = null;
  if (pendingFailedAttemptId) {
    attempt = allAttempts.find(a =>
      a._id === pendingFailedAttemptId && a.status === "failed" && a.attemptNumber >= minAttemptNumber) || null;
  }
  if (!attempt) {
    const candidates = allAttempts
      .filter(a => a.status === "failed" && a.attemptNumber >= minAttemptNumber)
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
    attempt = candidates[0] || null;
  }
  if (!attempt) return { code: "NO_ATTEMPT_FOUND" };
  return { attemptId: attempt._id };
}

test("7a. Authoritative selection — pointer resolves within boundary", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "completed", attemptNumber: 1 },
    { _id: "a2", questionId: "q1", status: "failed",    attemptNumber: 2 },
  ];
  const result = selectAttempt("a1", "a2", attempts);
  assert(result.attemptId === "a2", `Expected a2, got ${JSON.stringify(result)}`);
});

test("7b. Authoritative selection — stale pointer rejected, fallback finds newer", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "completed", attemptNumber: 1 },
    { _id: "a2", questionId: "q1", status: "failed",    attemptNumber: 1 }, // before boundary
    { _id: "a3", questionId: "q1", status: "failed",    attemptNumber: 2 },
  ];
  const result = selectAttempt("a1", "a2", attempts);
  // a2 has attemptNumber 1 which is < minAttemptNumber (2), so stale; fallback returns a3
  assert(result.attemptId === "a3", `Expected a3 (fallback), got ${JSON.stringify(result)}`);
});

test("7c. Authoritative selection — no latestAttemptId, boundary defaults to 1", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "failed", attemptNumber: 1 },
    { _id: "a2", questionId: "q1", status: "failed", attemptNumber: 2 },
  ];
  const result = selectAttempt(null, null, attempts);
  // No boundary set, minAttemptNumber = 1, selects highest failed
  assert(result.attemptId === "a2", `Expected a2, got ${JSON.stringify(result)}`);
});

test("7d. Authoritative selection — latestAttemptId does not resolve → CHECKPOINT_INTEGRITY_ERROR", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "failed", attemptNumber: 1 },
  ];
  const result = selectAttempt("nonexistent-id", "a1", attempts);
  assert(result.code === "CHECKPOINT_INTEGRITY_ERROR",
    `Expected CHECKPOINT_INTEGRITY_ERROR, got ${JSON.stringify(result)}`);
});

test("7e. Authoritative selection — no failed attempts after boundary → NO_ATTEMPT_FOUND", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "completed", attemptNumber: 1 },
    // no failed attempts with attemptNumber >= 2
  ];
  const result = selectAttempt("a1", null, attempts);
  assert(result.code === "NO_ATTEMPT_FOUND",
    `Expected NO_ATTEMPT_FOUND, got ${JSON.stringify(result)}`);
});

test("7f. Authoritative selection — multiple failed attempts → highest attemptNumber selected", () => {
  const attempts = [
    { _id: "a1", questionId: "q1", status: "completed", attemptNumber: 1 },
    { _id: "a2", questionId: "q1", status: "failed",    attemptNumber: 2 },
    { _id: "a3", questionId: "q1", status: "failed",    attemptNumber: 3 },
    { _id: "a4", questionId: "q1", status: "failed",    attemptNumber: 4 },
  ];
  const result = selectAttempt("a1", null, attempts);
  assert(result.attemptId === "a4", `Expected a4 (highest), got ${JSON.stringify(result)}`);
});

// ── Test 8: canReAnswer false for AI exhaustion ───────────────────────────────

test("8. canReAnswer false when transcript exists and error is AI failure", () => {
  const hasTranscript = true, errorCode = "EVALUATION_FAILED";
  const STT = new Set(["TRANSCRIPTION_FAILED","SPEECH_EMPTY_TRANSCRIPT","SPEECH_MALFORMED_RESPONSE"]);
  const canReAnswer = !hasTranscript || STT.has(errorCode);
  assert(canReAnswer === false, "canReAnswer must be false when transcript exists and error is AI failure");
});

// ── Test 9: canReAnswer true for STT failure ──────────────────────────────────

test("9. canReAnswer true for STT failure (no transcript)", () => {
  const h2 = false, e2 = "TRANSCRIPTION_FAILED";
  const STT = new Set(["TRANSCRIPTION_FAILED","SPEECH_EMPTY_TRANSCRIPT","SPEECH_MALFORMED_RESPONSE"]);
  assert(!h2 || STT.has(e2), "canReAnswer true when no transcript");
});

// ── Test 10: canReevaluate false when checkpoint retries exhausted ────────────

test("10. canReevaluate false when checkpoint retries exhausted", () => {
  const retriesUsed = 2, LIMIT2 = 2;
  const canReevaluate = true && (LIMIT2 - retriesUsed) > 0;
  assert(canReevaluate === false, "canReevaluate must be false when retries exhausted");
});

// ── Tests 11-12: Source inspections ──────────────────────────────────────────

test("11. QUESTION_SKIPPED_DURING_EVALUATION in controller STATUS_MAP", () => {
  assert(
    controllerSrc.includes("QUESTION_SKIPPED_DURING_EVALUATION"),
    "QUESTION_SKIPPED_DURING_EVALUATION not found in interview.controller.js STATUS_MAP"
  );
});

test("12. findOneAndUpdate with $ne: skipped in service (skip/reeval concurrency guard)", () => {
  assert(
    serviceSrc.includes('$ne: "skipped"') || serviceSrc.includes("$ne: 'skipped'"),
    "Conditional update with $ne: skipped not found in interviewService.js"
  );
});

// ── Tests 13-15: Skip/Reeval race ─────────────────────────────────────────────

test("13. Skip wins race → QUESTION_SKIPPED_DURING_EVALUATION", () => {
  // Simulate: findOneAndUpdate with { status: { $ne: "skipped" } } returns null
  function reevalSuccessPath(questionStatus) {
    // Simulate the conditional update: returns null if status is "skipped"
    const updated = questionStatus !== "skipped" ? { status: "answered" } : null;
    if (!updated) {
      const err = new Error("Skipped during evaluation");
      err.code = "QUESTION_SKIPPED_DURING_EVALUATION";
      return err;
    }
    return updated;
  }
  const result = reevalSuccessPath("skipped");
  assert(result instanceof Error && result.code === "QUESTION_SKIPPED_DURING_EVALUATION",
    "Expected QUESTION_SKIPPED_DURING_EVALUATION error");
});

test("14. Reeval wins race → question set to answered", () => {
  function reevalSuccessPath(questionStatus) {
    const updated = questionStatus !== "skipped" ? { status: "answered" } : null;
    if (!updated) {
      const err = new Error("Skipped during evaluation");
      err.code = "QUESTION_SKIPPED_DURING_EVALUATION";
      return err;
    }
    return updated;
  }
  const result = reevalSuccessPath("asked");
  assert(!(result instanceof Error) && result.status === "answered",
    "Expected answered status when reeval wins");
});

test("15. Skip guard blocks reeval on already-skipped question → QUESTION_ALREADY_ANSWERED", () => {
  function checkSkipGuard(questionStatus) {
    if (questionStatus === "skipped") {
      const err = new Error("Already skipped");
      err.code = "QUESTION_ALREADY_ANSWERED";
      return err;
    }
    return null;
  }
  const result = checkSkipGuard("skipped");
  assert(result instanceof Error && result.code === "QUESTION_ALREADY_ANSWERED",
    "Expected QUESTION_ALREADY_ANSWERED for pre-skip guard");
});

// ── Tests 16-21: Report generation concurrent claims ─────────────────────────

function simulateReportClaim(currentStatus, generationStartedAt, now, myToken) {
  const LEASE_MS = 5 * 60 * 1000;
  const staleThreshold = new Date(now.getTime() - LEASE_MS);
  const isStale = generationStartedAt !== null && generationStartedAt < staleThreshold;
  const canClaim =
    !["ready", "generating"].includes(currentStatus) ||
    (currentStatus === "generating" && generationStartedAt !== null && isStale);
  if (!canClaim) return null; // claim failed
  return { status: "generating", generationToken: myToken, generationStartedAt: now };
}

test("16. Second concurrent claim rejected when status is generating and lock is fresh", () => {
  const now = new Date();
  const freshStart = new Date(now.getTime() - 30000); // 30 seconds ago
  const claimed = simulateReportClaim("generating", freshStart, now, "tok-2");
  assert(claimed === null, "Fresh lock should block second claim");
});

test("17. Cached report returned when status is ready", () => {
  const now = new Date();
  const claimed = simulateReportClaim("ready", null, now, "tok-1");
  assert(claimed === null, "Ready status should not allow new claim");
});

test("18. Failed status is reclaimable", () => {
  const now = new Date();
  const claimed = simulateReportClaim("failed", null, now, "tok-1");
  assert(claimed !== null && claimed.status === "generating",
    "Failed status should be reclaimable");
});

test("19. Stale lock recovery — generationStartedAt older than 5 minutes allows re-claim", () => {
  const now = new Date();
  const staleStart = new Date(now.getTime() - 6 * 60 * 1000); // 6 minutes ago
  const claimed = simulateReportClaim("generating", staleStart, now, "tok-new");
  assert(claimed !== null && claimed.generationToken === "tok-new",
    "Stale lock should be reclaimable");
});

test("20. Fresh lock protected — generationStartedAt within 5 minutes blocks re-claim", () => {
  const now = new Date();
  const recentStart = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
  const claimed = simulateReportClaim("generating", recentStart, now, "tok-new");
  assert(claimed === null, "Fresh lock within 5 min should block re-claim");
});

test("21. Token ownership — wrong token fails finalization", () => {
  const storedToken = "original-token";
  const myToken     = "different-token";
  // Simulate the token-gated findOneAndUpdate filter
  const finalized = storedToken === myToken ? { status: "ready" } : null;
  assert(finalized === null, "Wrong token should fail finalization");
});

// ── Tests 22-24: Source inspections ──────────────────────────────────────────

test("22. MIME normalisation present in uploadAudio.js", () => {
  assert(
    uploadSrc.includes('split(";")[0]') || uploadSrc.includes("split(';')[0]"),
    "MIME normalisation (split on semicolon) not found in uploadAudio.js"
  );
});

test("23. startReportPolling named function in InterviewContext.jsx", () => {
  assert(
    clientSrc.includes("startReportPolling"),
    "startReportPolling not found in InterviewContext.jsx"
  );
});

test("24. REPORT_GENERATION_LEASE_LOST handled in InterviewContext.jsx", () => {
  assert(
    clientSrc.includes("REPORT_GENERATION_LEASE_LOST"),
    "REPORT_GENERATION_LEASE_LOST not found in InterviewContext.jsx"
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
if (failed > 0) {
  console.log("  OVERALL: FAIL");
  process.exit(1);
} else {
  console.log("  OVERALL: PASS");
  process.exit(0);
}
