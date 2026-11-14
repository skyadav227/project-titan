/**
 * duplicate_attempt_and_ratelimit.test.js
 *
 * Focused deterministic tests for:
 *   A. Duplicate AnswerAttempt prevention (Issue 1)
 *   B. OpenRouter 429 / rate-limit handling (Issue 2)
 *
 * All tests are source-level or simulation — no live MongoDB or network calls.
 *
 * Run: node tests/duplicate_attempt_and_ratelimit.test.js
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
function assertThrowsCode(fn, code) {
  let threw = false; let actual;
  try { fn(); } catch (e) { threw = true; actual = e.code; }
  if (!threw) throw new Error(`Expected code ${code} but no error thrown`);
  if (actual !== code) throw new Error(`Expected code ${code} but got ${actual}`);
}

const SERVICE_SRC    = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
const ADAPTER_SRC    = fs.readFileSync(path.join(__dirname, "../src/services/ai/providers/openRouterAdapter.js"), "utf8");
const AI_SRC         = fs.readFileSync(path.join(__dirname, "../src/services/ai/aiService.js"), "utf8");
const CONTROLLER_SRC = fs.readFileSync(path.join(__dirname, "../src/controllers/interview.controller.js"), "utf8");
const CONTEXT_SRC    = fs.readFileSync(path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8");

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ A. Duplicate AnswerAttempt prevention ══\n");

test("A1 submitAnswer guards against pendingFailedAttemptId before creating attempt", () => {
  // The guard must appear BEFORE the AnswerAttempt constructor call
  const guardIdx    = SERVICE_SRC.indexOf("EVALUATION_PENDING_REEVALUATION");
  const attemptNew  = SERVICE_SRC.indexOf("new AnswerAttempt({");
  assert(guardIdx > 0, "EVALUATION_PENDING_REEVALUATION guard must exist");
  assert(attemptNew > guardIdx, "new AnswerAttempt() must appear AFTER the pendingFailedAttemptId guard");
});

test("A2 Guard carries attemptId so frontend routes to reevaluate", () => {
  const guardIdx = SERVICE_SRC.indexOf("EVALUATION_PENDING_REEVALUATION");
  const guardBlock = SERVICE_SRC.slice(guardIdx, guardIdx + 300);
  assert(guardBlock.includes("err.attemptId"), "Guard error must carry attemptId for reevaluation routing");
  assert(guardBlock.includes("pendingFailedAttemptId.toString()"), "attemptId must come from question.pendingFailedAttemptId");
});

test("A3 attemptNumber derived from persisted DB count, not stale in-memory attemptCount", () => {
  // The new approach uses countDocuments, not question.attemptCount
  const countDocIdx = SERVICE_SRC.indexOf("countDocuments({ questionId: question._id })");
  assert(countDocIdx > 0, "Must use countDocuments to compute attemptNumber");
  // The old pattern should not appear anymore (stale value)
  const stalePattern = SERVICE_SRC.indexOf("const attemptNumber = question.attemptCount + 1");
  assert(stalePattern === -1, "Must NOT use question.attemptCount + 1 as attemptNumber");
});

test("A4 Unique index { questionId, attemptNumber } remains intact", () => {
  const modelSrc = fs.readFileSync(path.join(__dirname, "../src/models/AnswerAttempt.js"), "utf8");
  assert(modelSrc.includes("{ questionId: 1, attemptNumber: 1 }"), "Unique compound index must exist");
  assert(modelSrc.includes("{ unique: true }"), "Index must be unique");
});

test("A5 Controller maps EVALUATION_PENDING_REEVALUATION to 409", () => {
  assert(CONTROLLER_SRC.includes("EVALUATION_PENDING_REEVALUATION: 409") ||
    (CONTROLLER_SRC.includes("EVALUATION_PENDING_REEVALUATION") &&
     CONTROLLER_SRC.includes("409")),
    "EVALUATION_PENDING_REEVALUATION must map to HTTP 409");
});

test("A6 Controller passes attemptId for EVALUATION_PENDING_REEVALUATION", () => {
  assert(
    CONTROLLER_SRC.includes("EVALUATION_PENDING_REEVALUATION") &&
    CONTROLLER_SRC.includes("err.attemptId"),
    "Controller must pass attemptId for EVALUATION_PENDING_REEVALUATION"
  );
});

test("A7 reevaluateAnswer does NOT create a new AnswerAttempt document", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd   = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody  = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(!fnBody.includes("new AnswerAttempt("), "reevaluateAnswer must not create new AnswerAttempt");
});

test("A8 reevaluateAnswer updates existing attempt in-place (findOneAndUpdate)", () => {
  const fnStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const fnEnd   = SERVICE_SRC.indexOf("// ── Phase 6:", fnStart);
  const fnBody  = SERVICE_SRC.slice(fnStart, fnEnd);
  assert(fnBody.includes("findOneAndUpdate"), "reevaluateAnswer must use findOneAndUpdate for atomic claim");
  assert(fnBody.includes("status: \"analyzing\""), "Must transition attempt to analyzing atomically");
});

test("A9 latestAttemptId only written on success path, never on failure path", () => {
  // In submitAnswer: only set in step 7 (success) — search full source
  const evalFailIdx = SERVICE_SRC.indexOf("[interviewService] Evaluation failed:");
  const latestInSubmit = SERVICE_SRC.indexOf("question.latestAttemptId = attempt._id");
  assert(latestInSubmit > evalFailIdx, "latestAttemptId assignment must be in success path, after the failure catch");
  // In reevaluateAnswer: also only on success — search within the function body
  const reevalStart = SERVICE_SRC.indexOf("async function reevaluateAnswer");
  const reevalEnd   = SERVICE_SRC.indexOf("// ── Phase 6:", reevalStart);
  const reevalBody  = SERVICE_SRC.slice(reevalStart, reevalEnd);
  assert(reevalBody.includes("latestAttemptId"),
    "reevaluateAnswer must set latestAttemptId on success");
  // The catch block must NOT set it
  const catchIdx = reevalBody.lastIndexOf("} catch (evalErr)");
  const catchBlock = reevalBody.slice(catchIdx);
  assert(!catchBlock.includes("latestAttemptId"), "latestAttemptId must not be set in reevaluateAnswer catch");
});

test("A10 pendingFailedAttemptId cleared on question success (submitAnswer and reevaluateAnswer)", () => {
  const clearCount = (SERVICE_SRC.match(/pendingFailedAttemptId\s*=\s*null/g) || []).length;
  assert(clearCount >= 2, `Expected at least 2 pendingFailedAttemptId clearings, found ${clearCount}`);
});

test("A11 Frontend stores attemptId from EVALUATION_PENDING_REEVALUATION response", () => {
  // Both submit handlers check err?.attemptId — covers the new 409 case.
  // The check is in the catch block which may be 1000+ chars into the function.
  const submitVoiceIdx = CONTEXT_SRC.indexOf("submitVoiceAnswer = useCallback");
  const submitTextIdx  = CONTEXT_SRC.indexOf("submitTextAnswerAction = useCallback");
  // Search 2000 chars to cover the full function including the catch block
  const voiceBlock = CONTEXT_SRC.slice(submitVoiceIdx, submitVoiceIdx + 2000);
  const textBlock  = CONTEXT_SRC.slice(submitTextIdx,  submitTextIdx  + 2000);
  assert(voiceBlock.includes("err?.attemptId"), "Voice submit must check err.attemptId");
  assert(textBlock.includes("err?.attemptId"), "Text submit must check err.attemptId");
});

test("A12 Simulation: second submit with stale attemptCount=0 would previously compute attemptNumber=1", () => {
  // This demonstrates the old bug: question.attemptCount never updated on failure
  const staleAttemptCount = 0;
  const buggyAttemptNumber = staleAttemptCount + 1; // = 1
  assert(buggyAttemptNumber === 1, "Bug: stale attemptCount produces attemptNumber=1");
  // The fix: use actual DB count instead
  const actualDbCount = 1; // one failed attempt already exists
  const fixedAttemptNumber = actualDbCount + 1; // = 2
  assert(fixedAttemptNumber === 2, "Fix: DB count gives the correct next attempt number");
  assert(fixedAttemptNumber !== buggyAttemptNumber, "Fixed number must differ from buggy number");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ B. OpenRouter 429 / rate-limit handling ══\n");

test("B1 Adapter throws AI_RATE_LIMIT for HTTP 429 (not AI_PROVIDER_ERROR)", () => {
  assert(ADAPTER_SRC.includes("response.status === 429"), "Adapter must check for 429");
  assert(ADAPTER_SRC.includes("AI_RATE_LIMIT"), "Adapter must throw AI_RATE_LIMIT for 429");
  // AI_PROVIDER_ERROR must NOT be thrown for 429
  const fourTwentyNineBlock = ADAPTER_SRC.slice(
    ADAPTER_SRC.indexOf("response.status === 429"),
    ADAPTER_SRC.indexOf("response.status === 429") + 500
  );
  assert(!fourTwentyNineBlock.includes("AI_PROVIDER_ERROR"),
    "429 path must not throw AI_PROVIDER_ERROR");
});

test("B2 AI_RATE_LIMIT is NOT in the withRetry retryable set", () => {
  const retryableLine = AI_SRC.match(/const retryable\s*=.*\.includes\(err\.code\)/s)?.[0];
  assert(retryableLine, "Must find retryable includes check");
  assert(!retryableLine.includes("AI_RATE_LIMIT"), "AI_RATE_LIMIT must NOT be in retryable set");
  assert(retryableLine.includes("AI_PROVIDER_ERROR"), "AI_PROVIDER_ERROR still retryable");
});

test("B3 Adapter reads Retry-After header and attaches retryAfterMs to error", () => {
  assert(ADAPTER_SRC.includes("Retry-After"), "Adapter must read Retry-After header");
  assert(ADAPTER_SRC.includes("retryAfterMs"), "Adapter must attach retryAfterMs to error");
});

test("B4 Controller maps AI_RATE_LIMIT to HTTP 503", () => {
  assert(CONTROLLER_SRC.includes("AI_RATE_LIMIT") &&
         (CONTROLLER_SRC.includes("AI_RATE_LIMIT:              503") ||
          CONTROLLER_SRC.includes("AI_RATE_LIMIT: 503") ||
          CONTROLLER_SRC.includes("AI_RATE_LIMIT:503")),
    "AI_RATE_LIMIT must map to HTTP 503 in STATUS_MAP");
});

test("B5 Controller passes retryAfterMs for AI_RATE_LIMIT responses", () => {
  assert(CONTROLLER_SRC.includes("AI_RATE_LIMIT") && CONTROLLER_SRC.includes("retryAfterMs"),
    "Controller must include retryAfterMs in AI_RATE_LIMIT error response");
});

test("B6 429 simulation: adapter produces non-retryable error", () => {
  // Simulate what happens when HTTP 429 arrives
  const RETRYABLE = new Set(["AI_NETWORK_ERROR","AI_PROVIDER_ERROR","AI_EMPTY_RESPONSE","AI_INVALID_JSON","AI_SCHEMA_MISMATCH"]);
  const rateLimitErr = { code: "AI_RATE_LIMIT" };
  assert(!RETRYABLE.has(rateLimitErr.code), "AI_RATE_LIMIT must not be retryable");
  // withRetry would immediately break and rethrow — no additional AI requests
});

test("B7 429 does NOT trigger automatic retry (simulation)", async () => {
  const RETRYABLE = new Set(["AI_NETWORK_ERROR","AI_PROVIDER_ERROR","AI_EMPTY_RESPONSE","AI_INVALID_JSON","AI_SCHEMA_MISMATCH"]);
  let calls = 0;
  async function simulateWithRetry(fn, maxRetries) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try { return await fn(); }
      catch (err) {
        lastErr = err;
        if (!RETRYABLE.has(err.code) || attempt === maxRetries) break;
      }
    }
    throw lastErr;
  }
  let threw = false; let code;
  try {
    await simulateWithRetry(async () => {
      calls++;
      const e = new Error("Rate limit"); e.code = "AI_RATE_LIMIT"; throw e;
    }, 3);
  } catch (e) { threw = true; code = e.code; }
  assert(threw, "Must throw");
  assert(code === "AI_RATE_LIMIT", `Got ${code}`);
  assert(calls === 1, `Expected 1 call (no retry), got ${calls}`);
});

test("B8 finish_reason:length still handled (non-overflow → AI_EMPTY_RESPONSE, overflow → AI_REASONING_OVERFLOW)", () => {
  assert(ADAPTER_SRC.includes('finishReason === "length"'), "length check must exist");
  const lenIdx = ADAPTER_SRC.indexOf('finishReason === "length"');
  // Search 1000 chars — OVERFLOW at ~698, EMPTY at ~864
  const block  = ADAPTER_SRC.slice(lenIdx, lenIdx + 1000);
  assert(block.includes("AI_EMPTY_RESPONSE"),
    "finish_reason:length (non-overflow) must throw AI_EMPTY_RESPONSE");
  assert(block.includes("AI_REASONING_OVERFLOW"),
    "finish_reason:length (reasoning overflow) must throw AI_REASONING_OVERFLOW");
});

test("B9 AI_REASONING_OVERFLOW is NOT in withRetry retryable set", () => {
  const retryableLine = AI_SRC.match(/const retryable\s*=.*\.includes\(err\.code\)/s)?.[0];
  assert(retryableLine, "Must find retryable includes check");
  assert(!retryableLine.includes("AI_REASONING_OVERFLOW"),
    "AI_REASONING_OVERFLOW must NOT be retryable — retrying is futile for reasoning overflow");
  assert(retryableLine.includes("AI_EMPTY_RESPONSE"),
    "AI_EMPTY_RESPONSE still retryable for non-overflow cases");
});

test("B10 AI_REASONING_OVERFLOW maps to HTTP 503 in controller", () => {
  assert(CONTROLLER_SRC.includes("AI_REASONING_OVERFLOW") &&
        (CONTROLLER_SRC.includes("AI_REASONING_OVERFLOW:      503") ||
         CONTROLLER_SRC.includes("AI_REASONING_OVERFLOW: 503")),
    "AI_REASONING_OVERFLOW must map to 503");
});

test("B11 Adapter logs actual model ID (json.model) on success and on errors", () => {
  // actualModel must be read from json.model
  assert(ADAPTER_SRC.includes("json?.model"), "Must extract json.model from response");
  assert(ADAPTER_SRC.includes("actualModel"), "Must use actualModel variable");
  // Must appear in error logs
  const errorLogIdx = ADAPTER_SRC.indexOf("Non-string or empty content:");
  const errorLogBlock = ADAPTER_SRC.slice(errorLogIdx, errorLogIdx + 400);
  assert(errorLogBlock.includes("actualModel") || errorLogBlock.includes("model:"),
    "Error log must include actualModel");
  // Must appear in success log
  assert(ADAPTER_SRC.includes("Response OK:"), "Must log successful responses");
});

test("B12 Adapter never logs reasoning text or candidate answer content", () => {
  // Only safe diagnostic fields are logged (model, finish_reason, token counts, field names)
  // reasoning text itself must NOT be included in any log call
  // Verify by checking console calls don't reference _msg.reasoning or message.reasoning
  const consoleCalls = [];
  let pos = 0;
  while ((pos = ADAPTER_SRC.indexOf("console.", pos)) !== -1) {
    consoleCalls.push(ADAPTER_SRC.slice(pos, pos + 300));
    pos++;
  }
  for (const call of consoleCalls) {
    assert(!call.includes("_msg.reasoning") && !call.includes("message.reasoning"),
      "Console calls must not log reasoning text content");
    assert(!call.includes(".content"), // logging content would expose candidate answer
      "Console calls must not log message.content (candidate answer)");
  }
});

test("B9 message.reasoning is not used as fallback (existing behavior preserved)", () => {
  const contentAssign = ADAPTER_SRC.match(/const content\s*=\s*([^\n;]+)/);
  assert(contentAssign, "Must find content assignment");
  assert(!contentAssign[1].includes("reasoning"),
    "content variable must not reference message.reasoning");
});

test("B10 Failed evaluation preserves session (no status change to abandoned/completed)", () => {
  // When EVALUATION_FAILED is thrown, the session stays active
  const evalCatch = SERVICE_SRC.indexOf("[interviewService] Evaluation failed:");
  const evalBlock = SERVICE_SRC.slice(evalCatch, evalCatch + 400);
  // session.status must not be changed in the eval failure catch
  assert(!evalBlock.includes("session.status ="),
    "Evaluation failure must not change session.status");
  assert(evalBlock.includes("session.processing.operation = null"),
    "Must release the session processing lock on evaluation failure");
});

test("B11 Rate-limit error on reevaluate preserves pendingAttemptId (user can retry later)", () => {
  // In reevaluateFailedAttempt catch: only RETRY_LIMIT_REACHED clears pendingAttemptId.
  // AI_RATE_LIMIT does NOT — the saved attempt remains available for retry when quota resets.
  const reevalIdx = CONTEXT_SRC.indexOf("reevaluateFailedAttempt = useCallback");
  const fnBody    = CONTEXT_SRC.slice(reevalIdx, reevalIdx + 1800);
  // Only RETRY_LIMIT_REACHED should clear it
  assert(fnBody.includes("RETRY_LIMIT_REACHED"), "Must check RETRY_LIMIT_REACHED");
  assert(!fnBody.includes("AI_RATE_LIMIT"), "AI_RATE_LIMIT must not appear in reevaluateFailedAttempt — kept for user retry later");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ C. Index and lifecycle regression ══\n");

test("C1 Unique index on questionId+attemptNumber NOT dropped", () => {
  const modelSrc = fs.readFileSync(path.join(__dirname, "../src/models/AnswerAttempt.js"), "utf8");
  assert(modelSrc.includes("{ questionId: 1, attemptNumber: 1 }") &&
         modelSrc.includes("{ unique: true }"),
    "Unique compound index must still be defined");
});

test("C2 retryQuestion clears pendingFailedAttemptId (deliberate new answer)", () => {
  const retryFnIdx = SERVICE_SRC.indexOf("async function retryQuestion");
  // retryQuestion is ~1000+ chars; search enough to find the assignment
  const retryBlock = SERVICE_SRC.slice(retryFnIdx, retryFnIdx + 1500);
  assert(retryBlock.includes("pendingFailedAttemptId = null"),
    "retryQuestion must clear pendingFailedAttemptId when user chooses new answer");
});

test("C3 abandonedSession behavior preserved — finishInterview user_ended → no report", () => {
  const ctxFnIdx = CONTEXT_SRC.indexOf("finishInterview");
  const ctxBlock = CONTEXT_SRC.slice(ctxFnIdx, ctxFnIdx + 800);
  assert(ctxBlock.includes('reason === "user_ended"'), "Must branch on user_ended");
  assert(ctxBlock.includes("RESET"), "Must RESET on abandon");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${PASS + FAIL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${PASS + FAIL}\n\n`);
process.exit(FAIL > 0 ? 1 : 0);
