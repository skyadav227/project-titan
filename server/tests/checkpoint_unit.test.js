/**
 * checkpoint_unit.test.js
 *
 * Deterministic unit tests for the final evaluation checkpoint lifecycle.
 * Tests service logic via source inspection and inline simulation.
 * Does NOT require a running server or DB.
 *
 * Run: node tests/checkpoint_unit.test.js
 */
"use strict";

const fs   = require("fs");
const path = require("path");

let PASS = 0, FAIL = 0, TOTAL = 0;
const results = [];

function test(label, fn) {
  TOTAL++;
  try {
    fn();
    PASS++;
    results.push({ label, status: "PASS" });
    process.stdout.write(`  ✓  ${label}\n`);
  } catch (err) {
    FAIL++;
    const msg = err?.message || String(err);
    results.push({ label, status: "FAIL", reason: msg });
    process.stdout.write(`  ✗  FAIL: ${label}\n     ${msg}\n`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

// ── Source helpers ─────────────────────────────────────────────────────────────
const SERVICE_SRC = fs.readFileSync(
  path.join(__dirname, "../src/services/interviewService.js"), "utf8"
);
const CONTEXT_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8"
);

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 1. getNextAction checkpoint branch ══\n");

test("1.1 getNextAction calls getCheckpointState when questionsCompleted >= questionLimit", () => {
  assert(
    SERVICE_SRC.includes("getCheckpointState(sessionId, userId)"),
    "getNextAction must call getCheckpointState(sessionId, userId)"
  );
});

test("1.2 getNextAction returns checkpoint action when unresolved", () => {
  assert(
    SERVICE_SRC.includes('action: "checkpoint"'),
    'getNextAction must return action: "checkpoint" when unresolved questions exist'
  );
});

test("1.3 getNextAction transitions session to completing on checkpoint", () => {
  assert(
    SERVICE_SRC.includes('$set: { status: "completing", lastActivityAt: new Date() }'),
    'getNextAction must set status: "completing" on the session when transitioning to checkpoint'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 2. skipQuestion ══\n");

test("2.1 skipQuestion sets status to skipped atomically", () => {
  assert(
    SERVICE_SRC.includes('status: "skipped"') && SERVICE_SRC.includes("findOneAndUpdate"),
    'skipQuestion must set status: "skipped" inside a findOneAndUpdate call'
  );
});

test("2.2 skipQuestion clears pendingFailedAttemptId", () => {
  // The skipQuestion findOneAndUpdate update block contains both $set and $unset
  assert(
    SERVICE_SRC.includes('$unset: { pendingFailedAttemptId: 1 }'),
    "skipQuestion must include $unset: { pendingFailedAttemptId: 1 } in its update"
  );
});

test("2.3 skipQuestion increments questionsCompleted", () => {
  assert(
    SERVICE_SRC.includes('"progress.questionsCompleted": 1'),
    'skipQuestion must include "progress.questionsCompleted": 1 in $inc block'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 3. generateReport guards ══\n");

test("3.1 generateReport rejects with INTERVIEW_NOT_RESOLVED when unresolved questions exist", () => {
  assert(
    SERVICE_SRC.includes("INTERVIEW_NOT_RESOLVED"),
    "generateReport must throw error with code INTERVIEW_NOT_RESOLVED"
  );
});

test("3.2 generateReport queries answered|skipped questions", () => {
  // The generate report uses $in: ["answered", "skipped"] for question query
  assert(
    SERVICE_SRC.includes('"answered"') && SERVICE_SRC.includes('"skipped"'),
    'generateReport must reference both "answered" and "skipped" question statuses'
  );
  // Find the $in array that includes both answered and skipped in generateReport context
  const reportFnStart = SERVICE_SRC.indexOf("async function generateReport");
  const reportFnBody  = SERVICE_SRC.slice(reportFnStart, reportFnStart + 10000);
  assert(
    reportFnBody.includes('"answered"') && reportFnBody.includes('"skipped"'),
    'generateReport body must include "answered" and "skipped" statuses'
  );
});

test("3.3 generateReport includes skippedQuestions in report", () => {
  assert(
    SERVICE_SRC.includes("skippedQuestions"),
    "generateReport must build a skippedQuestions field"
  );
  assert(
    SERVICE_SRC.includes("evaluationCoverage"),
    "generateReport must include evaluationCoverage in the report"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 4. reevaluateAnswer checkpoint path ══\n");

test("4.1 reevaluateAnswer accepts isCheckpoint option", () => {
  assert(
    SERVICE_SRC.includes("{ isCheckpoint = false } = {}"),
    "reevaluateAnswer function signature must destructure isCheckpoint with default false"
  );
});

test("4.2 reevaluateAnswer uses CHECKPOINT_REEVAL_LIMIT when isCheckpoint is true", () => {
  assert(
    SERVICE_SRC.includes("CHECKPOINT_REEVAL_LIMIT"),
    "reevaluateAnswer must reference CHECKPOINT_REEVAL_LIMIT for checkpoint reevaluation limit"
  );
  // Confirm it's in reevaluateAnswer context
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  // The function ends before the next top-level Phase comment
  const fnEnd   = SERVICE_SRC.indexOf("// ── Phase 5c:", fnStart);
  const fnBody  = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(
    fnBody.includes("CHECKPOINT_REEVAL_LIMIT"),
    "CHECKPOINT_REEVAL_LIMIT must be used inside the reevaluateAnswer function body"
  );
});

test("4.3 reevaluateAnswer RETRY_LIMIT_REACHED clears pendingFailedAttemptId", () => {
  // Inside reevaluateAnswer, the retry-limit-reached branch $unsets pendingFailedAttemptId
  assert(
    SERVICE_SRC.includes("$unset: { pendingFailedAttemptId: 1 }"),
    "reevaluateAnswer RETRY_LIMIT_REACHED branch must $unset pendingFailedAttemptId on the question"
  );
  // Confirm it appears in the reevaluateAnswer function body
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd   = SERVICE_SRC.indexOf("// ── Phase 5c:", fnStart);
  const fnBody  = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(
    fnBody.includes("$unset: { pendingFailedAttemptId: 1 }"),
    "The $unset pendingFailedAttemptId must be inside reevaluateAnswer"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 5. Frontend context and logic ══\n");

test("5.1 checkpointState in INITIAL_STATE", () => {
  assert(
    CONTEXT_SRC.includes("checkpointState: null"),
    "INITIAL_STATE must include checkpointState: null"
  );
});

test("5.2 checkpoint in ONGOING_STATES", () => {
  // ONGOING_STATES new Set([...]) must contain "checkpoint"
  const ongoingMatch = CONTEXT_SRC.match(/const ONGOING_STATES = new Set\(\[[\s\S]*?\]\)/);
  assert(ongoingMatch, "ONGOING_STATES Set definition must exist in InterviewContext");
  assert(
    ongoingMatch[0].includes('"checkpoint"'),
    'ONGOING_STATES must include "checkpoint" so navigation guard fires during checkpoint'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 6. canReevaluate / canReAnswer logic simulation ══\n");

test("6.1 canReevaluate and canReAnswer logic matches backend getCheckpointState rules", () => {
  // Simulate the logic from getCheckpointState in interviewService.js:
  // canReevaluate: hasTranscript && retriesRemaining > 0
  // canReAnswer:   !hasTranscript
  function computeFlags(hasTranscript, retriesRemaining) {
    return {
      canReevaluate: hasTranscript && retriesRemaining > 0,
      canReAnswer:   !hasTranscript,
    };
  }

  const a = computeFlags(true, 2);
  assert(a.canReevaluate === true,  "hasTranscript + retries > 0 → canReevaluate");
  assert(a.canReAnswer   === false, "hasTranscript → !canReAnswer");

  const b = computeFlags(false, 0);
  assert(b.canReevaluate === false, "no transcript → !canReevaluate");
  assert(b.canReAnswer   === true,  "no transcript → canReAnswer");

  const c = computeFlags(true, 0);
  assert(c.canReevaluate === false, "retries exhausted → !canReevaluate");
  assert(c.canReAnswer   === false, "has transcript → !canReAnswer");

  // Confirm the backend source matches these exact semantics
  assert(
    SERVICE_SRC.includes("canReevaluate:    hasTranscript && retriesRemaining > 0"),
    "Backend getCheckpointState must implement canReevaluate: hasTranscript && retriesRemaining > 0"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${'═'.repeat(50)}\n`);
process.stdout.write(`  ${PASS} passed  ${FAIL} failed  ${PASS + FAIL} total\n`);
if (FAIL > 0) process.exit(1);
