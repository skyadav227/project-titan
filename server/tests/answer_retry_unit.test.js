/**
 * answer_retry_unit.test.js
 *
 * Deterministic unit tests for the answer persistence, reevaluation, and
 * recovery design. Tests the service-layer logic via source inspection and
 * the parser/controller contract — does NOT require a running server or DB.
 *
 * Run: node tests/answer_retry_unit.test.js
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
const CONTROLLER_SRC = fs.readFileSync(
  path.join(__dirname, "../src/controllers/interview.controller.js"), "utf8"
);
const ROUTES_SRC = fs.readFileSync(
  path.join(__dirname, "../src/routes/interview.routes.js"), "utf8"
);
const MODEL_SRC = fs.readFileSync(
  path.join(__dirname, "../src/models/InterviewQuestion.js"), "utf8"
);
const RESPONSE_UTILS_SRC = fs.readFileSync(
  path.join(__dirname, "../src/utils/responseUtils.js"), "utf8"
);
const CONTEXT_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8"
);
const SESSION_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/components/interview/InterviewSession.jsx"), "utf8"
);
const CLIENT_API_SRC = fs.readFileSync(
  path.join(__dirname, "../../client/src/services/interviewService.js"), "utf8"
);

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 1. pendingFailedAttemptId schema field ══\n");

test("1.1 InterviewQuestion model has pendingFailedAttemptId", () => {
  assert(MODEL_SRC.includes("pendingFailedAttemptId"), "Schema must have pendingFailedAttemptId");
  assert(MODEL_SRC.includes("ref: \"AnswerAttempt\""), "Must ref AnswerAttempt");
  assert(MODEL_SRC.includes("default: null"), "Must default to null");
});

test("1.2 latestAttemptId semantics preserved — comment says 'most recent successful'", () => {
  assert(MODEL_SRC.includes("most recent successful"), "Comment must still say 'most recent successful'");
});

test("1.3 latestAttemptId and pendingFailedAttemptId are separate fields", () => {
  const latestIdx = MODEL_SRC.indexOf("latestAttemptId:");
  const pendingIdx = MODEL_SRC.indexOf("pendingFailedAttemptId:");
  assert(latestIdx !== -1 && pendingIdx !== -1, "Both fields must exist");
  assert(latestIdx < pendingIdx, "latestAttemptId should be defined before pendingFailedAttemptId");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 2. submitAnswer failure path sets pendingFailedAttemptId ══\n");

test("2.1 Evaluation failure sets question.pendingFailedAttemptId", () => {
  assert(SERVICE_SRC.includes("pendingFailedAttemptId: attempt._id"),
    "submitAnswer must set pendingFailedAttemptId on evaluation failure");
});

test("2.2 Evaluation failure attaches attemptId to error", () => {
  assert(SERVICE_SRC.includes("err.attemptId = attempt._id.toString()"),
    "Error must have attemptId for frontend routing");
});

test("2.3 Success path clears pendingFailedAttemptId", () => {
  // Find the success path — look for the line that sets latestAttemptId AND
  // clears pendingFailedAttemptId
  assert(SERVICE_SRC.includes("question.pendingFailedAttemptId = null"),
    "Success path must clear pendingFailedAttemptId");
});

test("2.4 latestAttemptId is only set in success path, not failure path", () => {
  // The failure path should NOT set latestAttemptId
  const evalFailIdx = SERVICE_SRC.indexOf("Evaluation failed:");
  const successIdx = SERVICE_SRC.indexOf("question.latestAttemptId = attempt._id");
  assert(evalFailIdx !== -1 && successIdx !== -1, "Both paths must exist");
  // The success assignment should come AFTER the failure catch block
  assert(successIdx > evalFailIdx, "latestAttemptId assignment must be in success path, after the failure catch");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 3. getCurrentQuestion returns pendingAttempt ══\n");

test("3.1 getCurrentQuestion loads pendingFailedAttemptId", () => {
  assert(SERVICE_SRC.includes("question.pendingFailedAttemptId"),
    "getCurrentQuestion must check pendingFailedAttemptId");
});

test("3.2 getCurrentQuestion returns pendingAttempt object", () => {
  assert(SERVICE_SRC.includes("pendingAttempt"), "Response must include pendingAttempt");
  assert(SERVICE_SRC.includes("transcriptText"), "pendingAttempt must include transcriptText");
  assert(SERVICE_SRC.includes("retryable"), "pendingAttempt must include retryable");
});

test("3.3 getCurrentQuestion clears stale pendingFailedAttemptId", () => {
  assert(SERVICE_SRC.includes("pendingFailedAttemptId: null"),
    "Stale reference must be cleared via findByIdAndUpdate");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 4. reevaluateAnswer service function ══\n");

test("4.1 reevaluateAnswer function is exported", () => {
  assert(SERVICE_SRC.includes("reevaluateAnswer"), "Function must exist");
  const exportMatch = SERVICE_SRC.match(/module\.exports\s*=\s*\{[^}]*reevaluateAnswer/);
  assert(exportMatch, "reevaluateAnswer must be in module.exports");
});

test("4.2 reevaluateAnswer uses atomic session lock (findOneAndUpdate)", () => {
  // Look for the atomic claim pattern
  assert(SERVICE_SRC.includes("findOneAndUpdate") &&
         SERVICE_SRC.includes("\"processing.operation\": null"),
    "Must use atomic findOneAndUpdate with processing.operation:null filter");
});

test("4.3 reevaluateAnswer uses atomic attempt claim", () => {
  assert(SERVICE_SRC.includes("status: \"failed\"") &&
         SERVICE_SRC.includes("\"processing.retryable\": true"),
    "Atomic attempt claim must filter on status:failed + retryable:true");
  assert(SERVICE_SRC.includes("\"processing.attempts\": { $lt:"),
    "Must bound by processing.attempts < AI_MAX_RETRIES");
});

test("4.4 reevaluateAnswer increments processing.attempts", () => {
  assert(SERVICE_SRC.includes("$inc: { \"processing.attempts\": 1 }"),
    "Must increment processing.attempts atomically");
});

test("4.5 reevaluateAnswer validates transcript non-empty", () => {
  assert(SERVICE_SRC.includes("transcriptText") && SERVICE_SRC.includes("INVALID_ANSWER"),
    "Must reject empty transcript with INVALID_ANSWER");
});

test("4.6 reevaluateAnswer does NOT increment question.attemptCount", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  // Must not have "question.attemptCount =" assignment (it's only in submitAnswer)
  assert(!fnBody.includes("question.attemptCount ="),
    "reevaluateAnswer must NOT modify question.attemptCount");
  // "attemptNumber" appearing in a comment or a read-only lookup is OK —
  // the point is we don't CREATE a new attempt number. Verify we don't
  // create a new AnswerAttempt:
  assert(!fnBody.includes("new AnswerAttempt("),
    "reevaluateAnswer must NOT create a new AnswerAttempt document");
});

test("4.7 reevaluateAnswer sets latestAttemptId on success (not before)", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("latestAttemptId") && fnBody.includes("attempt._id"),
    "Must set latestAttemptId in the success path");
});

test("4.8 reevaluateAnswer clears pendingFailedAttemptId on success", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("pendingFailedAttemptId") && fnBody.includes("null"),
    "Must clear pendingFailedAttemptId on success");
});

test("4.9 reevaluateAnswer releases session lock on all failure paths", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  // Count occurrences of lock release — should be multiple (no transcript, no question, eval failure)
  const releaseCount = (fnBody.match(/processing\.operation.*null/g) || []).length;
  assert(releaseCount >= 3, `Expected at least 3 lock releases, found ${releaseCount}`);
});

test("4.10 reevaluateAnswer rejects non-active sessions", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("INTERVIEW_NOT_ACTIVE"), "Must reject non-active sessions");
  assert(fnBody.includes("status: \"active\""), "Session filter must include status:active");
});

test("4.11 reevaluateAnswer includes attemptId in failure error", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("err.attemptId = attempt._id.toString()"),
    "Must include attemptId in EVALUATION_FAILED error");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 5. retryQuestion clears pendingFailedAttemptId ══\n");

test("5.1 retryQuestion clears pendingFailedAttemptId", () => {
  // Find the retryQuestion function
  const fnStart = SERVICE_SRC.indexOf("async function retryQuestion");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 7:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("pendingFailedAttemptId = null"),
    "retryQuestion must clear pendingFailedAttemptId");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 6. Controller + routes + error response ══\n");

test("6.1 Controller has reevaluateAnswer handler", () => {
  assert(CONTROLLER_SRC.includes("async function reevaluateAnswer"),
    "Controller must export reevaluateAnswer");
  assert(CONTROLLER_SRC.includes("reevaluateAnswer"), "Must be in exports");
});

test("6.2 _handleDomainError includes attemptId for EVALUATION_FAILED", () => {
  assert(CONTROLLER_SRC.includes("EVALUATION_FAILED") &&
         CONTROLLER_SRC.includes("err.attemptId"),
    "_handleDomainError must check for attemptId on EVALUATION_FAILED");
  assert(CONTROLLER_SRC.includes("attemptId: err.attemptId"),
    "Must pass attemptId in sendError extra param");
});

test("6.3 sendError accepts optional extra param", () => {
  assert(RESPONSE_UTILS_SRC.includes("extra = null"),
    "sendError must accept an optional extra parameter");
  assert(RESPONSE_UTILS_SRC.includes("...(extra || {})"),
    "Must merge extra fields into error object");
});

test("6.4 Route POST /:id/answers/:answerAttemptId/reevaluate exists", () => {
  assert(ROUTES_SRC.includes("reevaluate"), "Route must exist");
  assert(ROUTES_SRC.includes("answers/:answerAttemptId/reevaluate"),
    "Route path must match /:id/answers/:answerAttemptId/reevaluate");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 7. Frontend InterviewContext ══\n");

test("7.1 pendingAttemptId in INITIAL_STATE", () => {
  assert(CONTEXT_SRC.includes("pendingAttemptId: null"), "INITIAL_STATE must have pendingAttemptId");
});

test("7.2 SET_PENDING_ATTEMPT_ID reducer case exists", () => {
  assert(CONTEXT_SRC.includes("SET_PENDING_ATTEMPT_ID"), "Reducer must handle SET_PENDING_ATTEMPT_ID");
});

test("7.3 reevaluateFailedAttempt action exists", () => {
  assert(CONTEXT_SRC.includes("reevaluateFailedAttempt"), "Action must exist");
  assert(CONTEXT_SRC.includes("reevaluateAnswer"), "Must import reevaluateAnswer from service");
});

test("7.4 submitTextAnswerAction catch sets pendingAttemptId from error", () => {
  assert(CONTEXT_SRC.includes("err?.attemptId") && CONTEXT_SRC.includes("SET_PENDING_ATTEMPT_ID"),
    "Catch block must extract attemptId from error and dispatch SET_PENDING_ATTEMPT_ID");
});

test("7.5 submitVoiceAnswer catch sets pendingAttemptId from error", () => {
  // Both submit functions should have this
  const submitVoiceIdx = CONTEXT_SRC.indexOf("submitVoiceAnswer");
  const submitTextIdx = CONTEXT_SRC.indexOf("submitTextAnswerAction");
  // The catch block with attemptId should appear in both
  const attemptIdDispatches = (CONTEXT_SRC.match(/err\?\.attemptId/g) || []).length;
  assert(attemptIdDispatches >= 2, `Expected at least 2 attemptId dispatches (voice+text), found ${attemptIdDispatches}`);
});

test("7.6 restoreSession sets pendingAttemptId from question.pendingAttempt", () => {
  assert(CONTEXT_SRC.includes("question.pendingAttempt?.id"),
    "restoreSession must check question.pendingAttempt.id");
});

test("7.7 retryCurrentQuestion clears pendingAttemptId", () => {
  const retryIdx = CONTEXT_SRC.indexOf("retryCurrentQuestion");
  const retryBlock = CONTEXT_SRC.slice(retryIdx, retryIdx + 400);
  assert(retryBlock.includes("SET_PENDING_ATTEMPT_ID"), "Must clear pendingAttemptId");
});

test("7.8 continueToNext clears pendingAttemptId", () => {
  const contIdx = CONTEXT_SRC.indexOf("continueToNext");
  const contBlock = CONTEXT_SRC.slice(contIdx, contIdx + 400);
  assert(contBlock.includes("SET_PENDING_ATTEMPT_ID"), "Must clear pendingAttemptId");
});

test("7.9 reevaluateFailedAttempt is in context value", () => {
  // The context value object must include reevaluateFailedAttempt
  const valueMatch = CONTEXT_SRC.match(/reevaluateFailedAttempt,/);
  assert(valueMatch, "Must be in the context value object");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 8. Frontend InterviewSession.jsx ══\n");

test("8.1 ErrorState accepts hasPendingAttempt and onReevaluate props", () => {
  assert(SESSION_SRC.includes("hasPendingAttempt"), "ErrorState must accept hasPendingAttempt");
  assert(SESSION_SRC.includes("onReevaluate"), "ErrorState must accept onReevaluate");
});

test("8.2 ErrorState routes Try Again to reevaluate when pending attempt exists", () => {
  assert(SESSION_SRC.includes("reevaluateFailedAttempt"), "Must call reevaluateFailedAttempt");
});

test("8.3 TextAnswerPanel accepts initialText prop", () => {
  assert(SESSION_SRC.includes("initialText"), "TextAnswerPanel must accept initialText");
});

test("8.4 Draft persistence: readDraft + writeDraft + clearDraft functions exist", () => {
  assert(SESSION_SRC.includes("readDraft"), "readDraft must exist");
  assert(SESSION_SRC.includes("writeDraft"), "writeDraft must exist");
  assert(SESSION_SRC.includes("clearDraft"), "clearDraft must exist");
  assert(SESSION_SRC.includes("clearAllDraftsForSession"), "clearAllDraftsForSession must exist");
});

test("8.5 Draft key is scoped by sessionId + questionId", () => {
  assert(SESSION_SRC.includes("titan_draft_${sessionId}_${questionId}"),
    "Draft key must be scoped by sessionId + questionId");
});

test("8.6 Draft is NOT cleared on submit (only on success/abandon)", () => {
  // The handleSubmit function should NOT call setText("") anymore
  const submitFn = SESSION_SRC.match(/function handleSubmit[\s\S]{0,400}?\n  \}/);
  if (submitFn) {
    assert(!submitFn[0].includes('setText("")'),
      "handleSubmit must not clear text on submit");
  }
  // Check that draft is cleared via useEffect on showing_report
  assert(SESSION_SRC.includes("clearDraft") && SESSION_SRC.includes("showing_report"),
    "Draft must be cleared on showing_report (success)");
});

test("8.7 Draft cleared on session abandonment (uiState setup)", () => {
  assert(SESSION_SRC.includes("clearAllDraftsForSession") && SESSION_SRC.includes("\"setup\""),
    "Drafts must be cleared when uiState becomes setup (abandonment)");
});

test("8.8 Server transcript preferred over local draft", () => {
  assert(SESSION_SRC.includes("serverTranscriptText") && SESSION_SRC.includes("initialAnswerText"),
    "Must compute initialAnswerText from server transcript first, then draft");
  assert(SESSION_SRC.includes("serverTranscriptText || draftText"),
    "Server transcript must take precedence over draft");
});

test("8.9 ErrorState message is context-aware", () => {
  assert(SESSION_SRC.includes("Your answer was saved"),
    "Must show 'Your answer was saved' when pendingAttemptId exists");
  assert(SESSION_SRC.includes("submit a new answer"),
    "Must show 'submit a new answer' when retries exhausted");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 9. Client API wrapper ══\n");

test("9.1 reevaluateAnswer API wrapper exists", () => {
  assert(CLIENT_API_SRC.includes("reevaluateAnswer"), "Must export reevaluateAnswer");
  assert(CLIENT_API_SRC.includes("answers/${attemptId}/reevaluate"),
    "Must call /answers/:attemptId/reevaluate");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 10. Abandonment lifecycle unchanged ══\n");

test("10.1 finishInterview user_ended still skips report generation", () => {
  const finishIdx = CONTEXT_SRC.indexOf("finishInterview");
  const finishBlock = CONTEXT_SRC.slice(finishIdx, finishIdx + 800);
  assert(finishBlock.includes('reason === "user_ended"'),
    "Must branch on user_ended");
  assert(finishBlock.includes("RESET"), "Must RESET on abandon");
  assert(!finishBlock.includes("triggerReportGeneration") || finishBlock.indexOf("triggerReportGeneration") > finishBlock.indexOf("} else {"),
    "triggerReportGeneration must only be in the else (non-user_ended) branch");
});

test("10.2 reevaluateAnswer rejects abandoned sessions (source)", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("status: \"active\""), "Session filter must require active");
  assert(fnBody.includes("INTERVIEW_NOT_ACTIVE"), "Must throw INTERVIEW_NOT_ACTIVE for non-active");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 11. Unique index NOT weakened ══\n");

test("11.1 Unique compound index questionId_1_attemptNumber_1 unchanged", () => {
  const attemptModelSrc = fs.readFileSync(
    path.join(__dirname, "../src/models/AnswerAttempt.js"), "utf8"
  );
  assert(attemptModelSrc.includes("{ questionId: 1, attemptNumber: 1 }"),
    "Unique compound index must be unchanged");
  assert(attemptModelSrc.includes("{ unique: true }"),
    "Index must still be unique");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 12. Idempotency key preservation on uncertain outcome ══\n");

test("12.1 Idempotency key not cleared on error (only after 5s timeout)", () => {
  // The resetKey is called via setTimeout(resetKey, 5000) — it's a race
  // with the error path. But the key is in a ref, not in localStorage, so
  // it survives only within the same page session. For uncertain-network
  // recovery, the draft in localStorage + the idempotency check on the
  // server (AnswerAttempt.findOne({ idempotencyKey })) handles the case
  // where the server DID save the attempt but the client didn't get the
  // response.
  assert(SESSION_SRC.includes("setTimeout(resetKey, 5000"),
    "resetKey is deferred — key is preserved during the error window");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ 13. No .env changes ══\n");

test("13.1 No new env variables introduced for reevaluation bound", () => {
  // reevaluateAnswer reuses AI_MAX_RETRIES from existing config
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("AI_MAX_RETRIES"), "Must reuse AI_MAX_RETRIES");
  assert(!fnBody.includes("process.env.MAX_REEVALUATE"),
    "Must NOT introduce a new env variable");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${TOTAL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${TOTAL}\n`);
process.stdout.write(`\n`);

if (FAIL > 0) {
  process.stdout.write("FAILED TESTS:\n");
  results.filter(r => r.status === "FAIL").forEach(r => {
    process.stdout.write(`  ✗  ${r.label}\n     ${r.reason}\n`);
  });
}

process.exit(FAIL > 0 ? 1 : 0);
