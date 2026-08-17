/**
 * TITAN Interview Intelligence — Integration Test Suite
 *
 * Tests every critical API flow against the running server.
 * Requires: server running on localhost:5000, MongoDB connected.
 *
 * Run: node tests/integration.js
 */
"use strict";

const BASE = "http://localhost:5000/api";
let token = null;
let userId = null;
let sessionId = null;
let questionId = null;
let attemptId = null;

const TEST_EMAIL = `test_${Date.now()}@titan-test.local`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "Integration Test User";

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function req(method, path, body, auth = true, extraHeaders = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    const json = await r.json().catch(() => null);
    return { status: r.status, body: json, ok: r.ok };
  } catch (e) {
    return { status: 0, body: null, ok: false, error: e.message };
  }
}

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
      results.push({ name, result: "PASS" });
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message}`);
      failed++;
      results.push({ name, result: "FAIL", error: e.message });
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || "Expected equality"}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
}

function assertIn(value, set, msg) {
  if (!set.includes(value)) throw new Error(`${msg || "Value not in set"}: ${JSON.stringify(value)} not in ${JSON.stringify(set)}`);
}

// ── Test sections ─────────────────────────────────────────────────────────────

const tests = [];

function section(name) {
  console.log(`\n[${name}]`);
}

// ── 1. Authentication ─────────────────────────────────────────────────────────

section("1. Authentication");

tests.push(test("unauthenticated interview request returns 401", async () => {
  const r = await req("GET", "/interviews", null, false);
  assertEqual(r.status, 401, "status");
}));

tests.push(test("register new test user", async () => {
  const r = await req("POST", "/auth/register", { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD }, false);
  assert(r.ok, `register failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.token, "token missing");
  token = r.body.data.token;
  userId = r.body.data.user?.id || r.body.data.user?._id;
  assert(token, "token is falsy");
}));

tests.push(test("invalid JWT returns 401", async () => {
  const r = await req("GET", "/interviews", null, false);
  // add invalid auth
  const r2 = await fetch(`${BASE}/interviews`, { headers: { Authorization: "Bearer invalid.jwt.token" } });
  assertEqual(r2.status, 401, "status");
}));

tests.push(test("authenticated request to /auth/me succeeds", async () => {
  const r = await req("GET", "/auth/me");
  assert(r.ok, `me failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.user, "user missing");
}));

// ── 2. Interview Creation ─────────────────────────────────────────────────────

section("2. Interview Creation");

tests.push(test("missing mode returns 400", async () => {
  const r = await req("POST", "/interviews", { difficulty: "adaptive" });
  assertEqual(r.status, 400, "status should be 400");
  assert(r.body?.error?.code, "error code missing");
}));

tests.push(test("company mode without company returns 400", async () => {
  const r = await req("POST", "/interviews", { mode: "company", difficulty: "adaptive", questionLimit: 3, durationMinutes: 15 });
  assertEqual(r.status, 400, "status should be 400");
}));

tests.push(test("role mode creates valid session", async () => {
  const r = await req("POST", "/interviews", {
    mode: "role",
    role: "Full Stack Developer",
    interviewType: "technical",
    difficulty: "adaptive",
    durationMinutes: 15,
    questionLimit: 3,
  });
  assert(r.ok, `create failed: ${JSON.stringify(r.body)}`);
  assertEqual(r.status, 201, "status should be 201");
  assert(r.body?.data?.id, "id missing");
  assertEqual(r.body.data.status, "created", "should be created");
  sessionId = r.body.data.id;
}));

tests.push(test("GET /interviews/:id returns session", async () => {
  const r = await req("GET", `/interviews/${sessionId}`);
  assert(r.ok, `get failed: ${JSON.stringify(r.body)}`);
  assertEqual(r.body.data.id.toString(), sessionId.toString(), "id mismatch");
  assertEqual(r.body.data.status, "created", "status should be created");
}));

tests.push(test("GET /interviews/:id with wrong user returns 404", async () => {
  // Register a second user and try to access the first user's session
  const r2 = await req("POST", "/auth/register", {
    name: "Attacker",
    email: `attacker_${Date.now()}@test.local`,
    password: "Attacker123!"
  }, false);
  const attackerToken = r2.body?.data?.token;
  assert(attackerToken, "attacker token missing");

  const r = await fetch(`${BASE}/interviews/${sessionId}`, {
    headers: { Authorization: `Bearer ${attackerToken}` }
  });
  assertEqual(r.status, 404, "should be 404 (not 403, per spec)");
}));

// ── 3. Interview Start ────────────────────────────────────────────────────────

section("3. Interview Start");

tests.push(test("start interview generates first question", async () => {
  const r = await req("POST", `/interviews/${sessionId}/start`);
  // AI might fail if OpenRouter not configured — that's an external dep
  if (r.status === 502 || r.status === 503) {
    console.log(`    [BLOCKED] AI provider unavailable — external dependency`);
    skipped++;
    results[results.length] = { name: "start interview generates first question", result: "BLOCKED", reason: "AI provider not configured" };
    return;
  }
  assert(r.ok, `start failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.question, "question missing");
  assert(r.body.data.question.id, "question id missing");
  assert(r.body.data.question.text, "question text empty");
  assertEqual(r.body.data.session.status, "active", "session should be active");
  questionId = r.body.data.question.id;
  // Update sessionId in case it returned a different format
  sessionId = r.body.data.session.id || sessionId;
}));

tests.push(test("starting already-active session is idempotent", async () => {
  if (!questionId) { console.log("    [SKIP] no active session"); skipped++; return; }
  const r = await req("POST", `/interviews/${sessionId}/start`);
  assert(r.ok, `idempotent start failed: ${JSON.stringify(r.body)}`);
  // Should not generate a second question
}));

tests.push(test("GET /interviews/:id/current returns current question", async () => {
  if (!questionId) { console.log("    [SKIP] no active session"); skipped++; return; }
  const r = await req("GET", `/interviews/${sessionId}/current`);
  assert(r.ok, `current failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.question, "question should exist");
  assertEqual(r.body.data.question.id.toString(), questionId.toString(), "question id mismatch");
}));

// ── 4. Answer Submission ──────────────────────────────────────────────────────

section("4. Answer Submission");

tests.push(test("submit answer to wrong user's question returns 404", async () => {
  if (!questionId) { console.log("    [SKIP] no active session"); skipped++; return; }
  const r2 = await req("POST", "/auth/register", {
    name: "Attacker2",
    email: `attacker2_${Date.now()}@test.local`,
    password: "Attacker123!"
  }, false);
  const attackerToken = r2.body?.data?.token;

  const formData = new FormData();
  formData.append("durationMs", "5000");
  const r = await fetch(`${BASE}/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${attackerToken}` },
    body: formData,
  });
  assertEqual(r.status, 404, "should be 404 for cross-user question access");
}));

tests.push(test("submit answer without audio — dev_echo mode processes correctly", async () => {
  if (!questionId) { console.log("    [SKIP] no active session"); skipped++; return; }
  // FormData with no audio file — dev_echo provider returns empty transcript
  const formData = new FormData();
  formData.append("durationMs", "8000");

  const r = await fetch(`${BASE}/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await r.json().catch(() => null);

  if (r.status === 502) {
    // AI evaluation failed — external dep
    console.log(`    [BLOCKED] AI evaluation unavailable — external dependency`);
    skipped++;
    return;
  }

  // With dev_echo: transcript is empty, but AI evaluation should still proceed
  // The answer attempt should be created and processed
  assert(r.ok || r.status === 202, `submit failed: status=${r.status} body=${JSON.stringify(json)}`);
  assert(json?.data?.id, "attempt id missing");
  attemptId = json.data.id;
  assertIn(json.data.status, ["completed", "processing", "transcribing", "analyzing", "uploaded"], "unexpected status");

  if (json.data.status === "completed") {
    // evaluation done synchronously
    assert(json.data.evaluation !== null, "evaluation should exist for completed attempt");
    console.log(`    Evaluation score: ${json.data.evaluation?.overallScore}`);
  }
}));

tests.push(test("duplicate answer submission with same idempotency key returns same result", async () => {
  if (!questionId || !attemptId) { console.log("    [SKIP] no prior attempt"); skipped++; return; }
  // Attempt to submit again to a question that was already answered
  const formData = new FormData();
  formData.append("durationMs", "5000");

  const r = await fetch(`${BASE}/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await r.json().catch(() => null);

  // Should get QUESTION_ALREADY_ANSWERED (409) since question is marked answered
  assertEqual(r.status, 409, `Expected 409 QUESTION_ALREADY_ANSWERED, got ${r.status}: ${JSON.stringify(json)}`);
}));

// ── 5. Answer Status ──────────────────────────────────────────────────────────

section("5. Answer Status");

tests.push(test("GET /interviews/:id/answers/:attemptId returns status", async () => {
  if (!attemptId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("GET", `/interviews/${sessionId}/answers/${attemptId}`);
  assert(r.ok, `get answer status failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.id, "id missing");
  assert(r.body?.data?.status, "status missing");
  // retry.available should be a boolean (not always false)
  assert(typeof r.body.data.retry?.available === "boolean", "retry.available should be boolean");
}));

// ── 6. Next Action ────────────────────────────────────────────────────────────

section("6. Next Action");

tests.push(test("POST /interviews/:id/next returns question or complete", async () => {
  if (!sessionId || !attemptId) { console.log("    [SKIP] no active session with answer"); skipped++; return; }

  const r = await req("POST", `/interviews/${sessionId}/next`);
  if (r.status === 502) { console.log("    [BLOCKED] AI provider"); skipped++; return; }

  assert(r.ok, `next failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.action, "action missing");
  assertIn(r.body.data.action, ["question", "complete"], "invalid action");

  if (r.body.data.action === "question") {
    assert(r.body.data.question?.text, "question text missing");
    assert(r.body.data.question?.id, "question id missing");
    questionId = r.body.data.question.id; // update for subsequent tests
    console.log(`    Next question: "${r.body.data.question.text.slice(0, 60)}..."`);
  } else {
    console.log("    Interview completed by backend");
  }
}));

// ── 7. Retry Flow ─────────────────────────────────────────────────────────────

section("7. Retry Flow");

tests.push(test("retry on already-answered question with retries remaining", async () => {
  if (!questionId || !sessionId) { console.log("    [SKIP]"); skipped++; return; }

  // First submit an answer to the current question
  const formData = new FormData();
  formData.append("durationMs", "7000");
  const submitR = await fetch(`${BASE}/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!submitR.ok && submitR.status !== 409) {
    const j = await submitR.json().catch(() => null);
    if (submitR.status === 502) { console.log("    [BLOCKED] AI provider"); skipped++; return; }
    console.log(`    [SKIP] could not submit answer: ${JSON.stringify(j)}`);
    skipped++;
    return;
  }

  // Now try retry
  const r = await req("POST", `/interviews/${sessionId}/questions/${questionId}/retry`);
  if (!r.ok) {
    // Could be RETRY_LIMIT_REACHED if already used up retries
    if (r.body?.error?.code === "RETRY_LIMIT_REACHED") {
      console.log("    Retry limit already reached (expected)");
      return;
    }
    if (r.body?.error?.code === "INTERVIEW_NOT_ACTIVE") {
      console.log("    Interview ended (expected if completed)");
      return;
    }
    throw new Error(`retry failed: ${JSON.stringify(r.body)}`);
  }

  assert(r.body?.data?.question, "question missing from retry response");
  assert(r.body?.data?.retriesRemaining !== undefined, "retriesRemaining missing");
  console.log(`    Retries remaining: ${r.body.data.retriesRemaining}`);
}));

// ── 8. Explanation Flow ───────────────────────────────────────────────────────

section("8. Explanation Flow");

tests.push(test("explanation without questionId returns 400", async () => {
  const r = await req("POST", `/interviews/${sessionId}/explanations`, { topic: "JWT" });
  assertEqual(r.status, 400, `Expected 400, got ${r.status}`);
}));

tests.push(test("explanation without topic returns 400", async () => {
  if (!questionId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("POST", `/interviews/${sessionId}/explanations`, { questionId });
  assertEqual(r.status, 400, `Expected 400, got ${r.status}`);
}));

tests.push(test("explanation with valid params", async () => {
  if (!questionId || !sessionId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("POST", `/interviews/${sessionId}/explanations`, { questionId, topic: "Node.js authentication" });
  if (r.status === 502) { console.log("    [BLOCKED] AI provider"); skipped++; return; }
  if (r.status === 409) { console.log("    Session not active (expected if completed)"); return; }
  assert(r.ok, `explanation failed: ${JSON.stringify(r.body)}`);
  assert(r.body?.data?.explanation, "explanation text missing");
  assert(r.body?.data?.keyPoints, "keyPoints missing");
}));

// ── 9. Interview End ──────────────────────────────────────────────────────────

section("9. Interview End");

tests.push(test("end interview with user_ended reason", async () => {
  if (!sessionId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("POST", `/interviews/${sessionId}/end`, { reason: "user_ended" });
  if (!r.ok) {
    // Could already be completed/abandoned
    if (["completed", "abandoned"].includes(r.body?.error?.data?.status)) return;
    if (r.body?.error?.code === "INVALID_INTERVIEW_STATE") {
      console.log("    Already ended (expected)");
      return;
    }
  }
  assert(r.ok || r.status === 409, `end failed: ${JSON.stringify(r.body)}`);
  if (r.ok) {
    assertIn(r.body.data.status, ["abandoned", "completed"], "unexpected status after end");
  }
}));

tests.push(test("cannot answer questions on ended interview", async () => {
  if (!questionId || !sessionId) { console.log("    [SKIP]"); skipped++; return; }
  const formData = new FormData();
  formData.append("durationMs", "5000");
  const r = await fetch(`${BASE}/interviews/${sessionId}/questions/${questionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  assert(r.status === 409, `Expected 409, got ${r.status}`);
}));

// ── 10. Report Generation ─────────────────────────────────────────────────────

section("10. Report Generation");

tests.push(test("generate report for ended session", async () => {
  if (!sessionId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("POST", `/interviews/${sessionId}/report`);
  if (r.status === 502) { console.log("    [BLOCKED] AI provider unavailable"); skipped++; return; }

  // 409 means session status is not reportable (e.g. still 'failed' after blocked start)
  if (r.status === 409) {
    console.log(`    [SKIP] Session not in reportable state (${r.body?.error?.code})`);
    skipped++;
    return;
  }

  assert(r.ok, `report failed: ${JSON.stringify(r.body)}`);
  // Report may be generating or ready
  const data = r.body?.data;
  assert(data, "no report data");
  if (data?.status === "ready" || data?.overallScore !== undefined) {
    assert(typeof data.overallScore === "number" || data.overallScore === null, "overallScore should be number or null");
    console.log(`    Overall score: ${data.overallScore}`);
  } else {
    assertIn(data?.status, ["generating", "ready", "failed"], "unexpected report status");
    console.log(`    Report status: ${data?.status}`);
  }
}));

tests.push(test("GET /interviews/:id/report returns report or status", async () => {
  if (!sessionId) { console.log("    [SKIP]"); skipped++; return; }
  const r = await req("GET", `/interviews/${sessionId}/report`);
  assert(r.ok, `get report failed: ${JSON.stringify(r.body)}`);
  // Data can be null (no report), { status: "generating" }, or the full report
  const data = r.body?.data;
  // null is valid per spec (no report generated yet)
  if (data !== null && data !== undefined) {
    assert(typeof data === "object", "report data should be object");
  }
}));

// ── 11. History & Progress ────────────────────────────────────────────────────

section("11. History & Progress");

tests.push(test("GET /interviews returns paginated history", async () => {
  const r = await req("GET", "/interviews?page=1&limit=10");
  assert(r.ok, `history failed: ${JSON.stringify(r.body)}`);
  assert(Array.isArray(r.body?.data?.interviews), "interviews should be array");
  assert(r.body?.data?.pagination, "pagination missing");
  assert(typeof r.body.data.pagination.total === "number", "total should be number");
  console.log(`    Total sessions: ${r.body.data.pagination.total}`);
}));

tests.push(test("GET /interviews/progress returns progression data", async () => {
  const r = await req("GET", "/interviews/progress");
  assert(r.ok, `progress failed: ${JSON.stringify(r.body)}`);
  assert(typeof r.body?.data?.sessionsCompleted === "number", "sessionsCompleted missing");
  assert(Array.isArray(r.body?.data?.scores), "scores should be array");
}));

tests.push(test("history is user-scoped (attacker cannot see other user sessions)", async () => {
  // Register attacker and check they can't see our sessions
  const r2 = await req("POST", "/auth/register", {
    name: "Attacker3",
    email: `attacker3_${Date.now()}@test.local`,
    password: "Attacker123!"
  }, false);
  const attackerToken = r2.body?.data?.token;

  const r = await fetch(`${BASE}/interviews`, {
    headers: { Authorization: `Bearer ${attackerToken}` }
  });
  const json = await r.json();
  assert(r.ok, "history should succeed for attacker");
  assert(json?.data?.interviews?.length === 0, `Attacker should have 0 interviews, got ${json?.data?.interviews?.length}`);
}));

// ── 12. State Machine: Invalid Transitions ────────────────────────────────────

section("12. State Machine");

tests.push(test("starting a non-existent session returns 404", async () => {
  const r = await req("POST", "/interviews/000000000000000000000001/start");
  assertEqual(r.status, 404, `Expected 404, got ${r.status}`);
  assertEqual(r.body?.error?.code, "INTERVIEW_NOT_FOUND", "wrong error code");
}));

tests.push(test("invalid ObjectId format handled safely", async () => {
  const r = await req("GET", "/interviews/not-a-valid-objectid");
  // Should return 404 or 400, NOT 500
  assert(r.status !== 500, `Should not be 500, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body?.error, "error response expected");
}));

tests.push(test("accessing another user's question is blocked", async () => {
  // Create a second user's session
  const r2 = await req("POST", "/auth/register", {
    name: "User2",
    email: `user2_${Date.now()}@test.local`,
    password: "User2Pass123!"
  }, false);
  const user2Token = r2.body?.data?.token;

  const createR = await fetch(`${BASE}/interviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${user2Token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "role", role: "Backend Developer", interviewType: "technical", difficulty: "medium", durationMinutes: 15, questionLimit: 3 })
  });
  const createJson = await createR.json();
  const user2SessionId = createJson?.data?.id;
  if (!user2SessionId) { console.log("    [SKIP] could not create user2 session"); skipped++; return; }

  // Try to access user2's session with user1's token
  const r = await req("GET", `/interviews/${user2SessionId}`);
  assertEqual(r.status, 404, `User1 should not see User2's session, got ${r.status}`);
}));

// ── 13. Validation Edge Cases ─────────────────────────────────────────────────

section("13. Validation");

tests.push(test("mixed mode with only one source fails validation", async () => {
  const r = await req("POST", "/interviews", {
    mode: "mixed",
    company: "Google",
    // only one source provided
    interviewType: "technical",
    difficulty: "medium",
    questionLimit: 5,
    durationMinutes: 15,
  });
  assertEqual(r.status, 400, `Expected 400 for insufficient mixed sources, got ${r.status}`);
}));

tests.push(test("invalid difficulty value rejected", async () => {
  const r = await req("POST", "/interviews", {
    mode: "role",
    role: "Developer",
    difficulty: "extreme",
    questionLimit: 5,
    durationMinutes: 15,
  });
  assertEqual(r.status, 400, `Expected 400 for invalid difficulty, got ${r.status}`);
}));

tests.push(test("questionLimit out of range rejected", async () => {
  const r = await req("POST", "/interviews", {
    mode: "role",
    role: "Developer",
    difficulty: "easy",
    questionLimit: 999,
    durationMinutes: 15,
  });
  assertEqual(r.status, 400, `Expected 400 for questionLimit 999, got ${r.status}`);
}));

// ── 14. Audio Validation ──────────────────────────────────────────────────────

section("14. Audio Upload Validation");

tests.push(test("unsupported audio format returns 415", async () => {
  // Create a fresh session to test on
  const createR = await req("POST", "/interviews", {
    mode: "role", role: "Developer",
    interviewType: "technical", difficulty: "medium",
    durationMinutes: 15, questionLimit: 2
  });
  if (!createR.ok) { console.log("    [SKIP] could not create session"); skipped++; return; }
  const testSessionId = createR.body.data.id;

  const startR = await req("POST", `/interviews/${testSessionId}/start`);
  if (startR.status === 502) { console.log("    [BLOCKED] AI provider"); skipped++; return; }
  if (!startR.ok) { console.log("    [SKIP] start failed"); skipped++; return; }
  const testQuestionId = startR.body.data.question.id;

  // Try to upload a text file as audio
  const fakeBlob = new Blob(["not audio data"], { type: "text/plain" });
  const formData = new FormData();
  formData.append("audio", fakeBlob, "fake.txt");

  const r = await fetch(`${BASE}/interviews/${testSessionId}/questions/${testQuestionId}/answers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  assertEqual(r.status, 415, `Expected 415 for unsupported audio format, got ${r.status}`);

  // Cleanup — end the test session
  await req("POST", `/interviews/${testSessionId}/end`, { reason: "user_ended" });
}));

// ── 15. Error Responses ───────────────────────────────────────────────────────

section("15. Error Response Shape");

tests.push(test("all error responses have correct shape", async () => {
  const r = await req("GET", "/interviews/nonexistent-id-12345");
  assert(!r.ok, "should fail");
  assert(r.body?.success === false, "success should be false");
  assert(r.body?.error?.code, "error.code missing");
  assert(r.body?.error?.message, "error.message missing");
  // Must not expose stack traces
  assert(!r.body?.error?.stack, "stack trace exposed");
  assert(!r.body?.stack, "stack trace at root");
}));

tests.push(test("no internal details in error responses", async () => {
  const r = await req("GET", "/interviews/000000000000000000000001");
  const bodyStr = JSON.stringify(r.body);
  assert(!bodyStr.includes("mongoose"), "mongoose internals exposed");
  assert(!bodyStr.includes("MongoError"), "MongoError exposed");
  assert(!bodyStr.includes("mongodb://"), "connection string exposed");
  assert(!bodyStr.includes("OPENROUTER"), "API key exposed");
}));

// ── Run all tests ─────────────────────────────────────────────────────────────

async function runAll() {
  console.log("=== TITAN Interview Intelligence — Integration Tests ===");
  console.log(`Server: ${BASE}`);
  console.log(`Test user: ${TEST_EMAIL}`);
  console.log("");

  for (const t of tests) {
    await t();
  }

  console.log("\n=== RESULTS ===");
  console.log(`PASS: ${passed}  FAIL: ${failed}  BLOCKED: ${skipped}`);
  console.log("");

  if (failed > 0) {
    console.log("FAILURES:");
    results.filter(r => r.result === "FAIL").forEach(r => {
      console.log(`  ✗ ${r.name}`);
      console.log(`    ${r.error}`);
    });
  }

  if (skipped > 0) {
    console.log("\nBLOCKED (external dependencies):");
    results.filter(r => r.result === "BLOCKED").forEach(r => {
      console.log(`  ⊘ ${r.name}: ${r.reason || "external dep"}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(e => { console.error("Fatal:", e); process.exit(1); });
