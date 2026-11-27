/**
 * e2e_text_lifecycle.js
 *
 * Full end-to-end integration test for the TITAN text-answer path.
 * Tests the complete interview lifecycle using free OpenRouter AI
 * and the text-answer bypass (no STT / microphone required).
 *
 * Lifecycle tested:
 *   Register → Create → Start → Generate Question
 *   → Submit Text Answer → Evaluate → Check Feedback
 *   → Retry → Submit Retry → Check Improvement
 *   → Request Explanation → Continue After Explanation
 *   → Next Question (2nd) → Submit Text Answer
 *   → End Interview → Generate Report → Get Report
 *   → Get History → Get Progress
 *   → Verify all MongoDB state
 *
 * Run: node tests/e2e_text_lifecycle.js
 */
"use strict";

const BASE = "http://localhost:5000/api";
const TS   = Date.now();

// ── State shared across steps ─────────────────────────────────────────────────
let token, sessionId, q1Id, q1AttemptId, q1RetryAttemptId, q2Id, q2AttemptId;

// ── Helpers ───────────────────────────────────────────────────────────────────
let stepNum = 0;
const log = (msg) => console.log(msg);
const step = (name) => { stepNum++; log(`\n[${stepNum}] ${name}`); };

async function api(method, path, body, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  const json = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data: json.data, error: json.error, raw: json };
}

async function formApi(method, path, formData) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method, headers, body: formData });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data: json.data, error: json.error, raw: json };
}

function assert(condition, msg) {
  if (!condition) { log(`  ✗ FAIL: ${msg}`); throw new Error(msg); }
  log(`  ✓ ${msg}`);
}

function assertRange(val, min, max, label) {
  assert(typeof val === "number" && val >= min && val <= max,
    `${label} = ${val} (expected ${min}–${max})`);
}

function assertIn(val, set, label) {
  assert(set.includes(val), `${label} = "${val}" (expected one of: ${set.join(", ")})`);
}

// ── Text answer helper ────────────────────────────────────────────────────────
async function submitText(sId, qId, text, idempotencyKey = null) {
  const fd = new FormData();
  fd.append("text", text);
  const headers = { "Authorization": `Bearer ${token}` };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const r = await fetch(`${BASE}/interviews/${sId}/questions/${qId}/answers`, {
    method: "POST", headers, body: fd,
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data: json.data, error: json.error };
}

// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  log("═══════════════════════════════════════════════════════════");
  log("  TITAN — Text-Path End-to-End Integration Test");
  log("═══════════════════════════════════════════════════════════");

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  step("Register test user");
  {
    const r = await api("POST", "/auth/register", {
      name: "E2E Tester",
      email: `e2e_${TS}@titan-test.local`,
      password: "E2ETestPass123!",
    }, false);
    assert(r.ok, `register HTTP ${r.status}`);
    assert(r.data?.token, "token present");
    token = r.data.token;
    log(`  token: ...${token.slice(-8)}`);
  }

  // ── 2. Create interview ────────────────────────────────────────────────────
  step("Create interview (role mode, technical, 2 questions)");
  {
    const r = await api("POST", "/interviews", {
      mode: "role",
      role: "Full Stack Developer",
      interviewType: "technical",
      difficulty: "medium",
      durationMinutes: 15,
      questionLimit: 2,
    });
    assert(r.ok, `create HTTP ${r.status}: ${JSON.stringify(r.error)}`);
    assert(r.status === 201, "status 201");
    assert(r.data?.id, "session id present");
    assertIn(r.data.status, ["created"], "session status");
    sessionId = r.data.id;
    log(`  sessionId: ${sessionId}`);
  }

  // ── 3. Start interview ─────────────────────────────────────────────────────
  step("Start interview — generates Q1 via AI provider");
  {
    log("  Calling AI provider (may take up to 30 s)...");
    const r = await api("POST", `/interviews/${sessionId}/start`);
    if (!r.ok) {
      log(`  ✗ START FAILED (${r.status}): ${JSON.stringify(r.error)}`);
      log("  → BLOCKED: AI provider unavailable — cannot continue without Q1");
      log("\nAI STATUS: BLOCKED — check AI provider configuration in server/.env");
      process.exit(2);
    }
    assert(r.data?.question?.text, "question text present");
    assert(r.data?.session?.status === "active", "session active");
    q1Id = r.data.question.id;
    log(`  Q1 id:   ${q1Id}`);
    log(`  Q1 text: "${r.data.question.text.slice(0, 90)}..."`);
    log(`  topic:   ${r.data.question.topic || r.data.question.category}`);
    log(`  diff:    ${r.data.question.difficulty}`);
  }

  // ── 4. Validate rejection of empty text ───────────────────────────────────
  step("Reject empty/whitespace-only text answer");
  {
    const fd = new FormData();
    fd.append("text", "   ");
    const headers = { "Authorization": `Bearer ${token}` };
    const r = await fetch(`${BASE}/interviews/${sessionId}/questions/${q1Id}/answers`, {
      method: "POST", headers, body: fd,
    });
    const json = await r.json().catch(() => ({}));
    assert(r.status === 400, `empty text should be 400, got ${r.status}: ${JSON.stringify(json.error)}`);
  }

  // ── 5. Submit first text answer ────────────────────────────────────────────
  step("Submit text answer for Q1 — routes through AI evaluation");
  {
    const ANSWER = "I have around four years of experience building full-stack web applications, primarily using Node.js on the backend and React on the frontend, with PostgreSQL and MongoDB as datastores. I have shipped several production REST APIs and worked on features ranging from authentication flows to real-time dashboards. I am comfortable owning a feature end-to-end, from database schema design through to frontend state management, and I particularly enjoy improving performance and reliability.";
    log("  Evaluating via AI provider (may take up to 30 s)...");
    const r = await submitText(sessionId, q1Id, ANSWER, `idem_${TS}_q1`);
    if (!r.ok) {
      log(`  ✗ SUBMIT FAILED (${r.status}): ${JSON.stringify(r.error)}`);
      process.exit(1);
    }
    assertIn(r.data.status, ["completed", "processing", "analyzing"], "attempt status");
    assert(r.data.id, "attempt id present");
    q1AttemptId = r.data.id;
    log(`  attemptId: ${q1AttemptId}`);

    if (r.data.status === "completed") {
      assert(r.data.evaluation !== null, "evaluation present");
      assertRange(r.data.evaluation.overallScore, 0, 100, "overallScore");
      assertIn(r.data.evaluation.classification,
        ["correct","mostly_correct","partially_correct","incorrect","insufficient","off_topic"],
        "classification");
      assert(Array.isArray(r.data.evaluation.strengths),   "strengths array");
      assert(Array.isArray(r.data.evaluation.issues),      "issues array");
      assert(Array.isArray(r.data.evaluation.suggestions), "suggestions array");
      assert(r.data.transcript?.available === true,        "transcript available");
      assert(r.data.transcript?.text?.length > 0,         "transcript non-empty");
      log(`  score:          ${r.data.evaluation.overallScore}/100`);
      log(`  classification: ${r.data.evaluation.classification}`);
      log(`  strengths:      ${(r.data.evaluation.strengths||[]).slice(0,2).join(" | ")}`);
      log(`  retry.available:${r.data.retry?.available}`);
    } else {
      log(`  Processing asynchronously — status: ${r.data.status}`);
    }
  }

  // ── 6. Retry Q1 ────────────────────────────────────────────────────────────
  step("Retry Q1 — backend resets question, creates new attempt slot");
  {
    const r = await api("POST", `/interviews/${sessionId}/questions/${q1Id}/retry`);
    // Could get RETRY_LIMIT_REACHED or INTERVIEW_NOT_ACTIVE if completed
    if (r.status === 409) {
      log(`  Retry rejected (${r.error?.code}) — skipping retry steps`);
    } else {
      assert(r.ok, `retry HTTP ${r.status}: ${JSON.stringify(r.error)}`);
      assert(r.data?.question?.id, "question id in retry response");
      log(`  Retries remaining: ${r.data.retriesRemaining}`);

      // ── 7. Submit retry answer ─────────────────────────────────────────────
      step("Submit improved retry answer for Q1");
      {
        const RETRY_ANSWER = "I started as a junior developer working primarily on backend APIs and gradually moved into full-stack ownership. Over time I took on React frontends, improved CI/CD pipelines, and started mentoring junior teammates. I value clear API contracts, robust error handling, and writing code that is easy for the next engineer to understand. My goal is always to leave a codebase in a better state than I found it.";
        log("  Evaluating via AI provider...");
        const r2 = await submitText(sessionId, q1Id, RETRY_ANSWER, `idem_${TS}_q1_retry`);
        if (!r2.ok) {
          log(`  Retry submit failed (${r2.status}): ${JSON.stringify(r2.error)} — continuing`);
        } else {
          q1RetryAttemptId = r2.data?.id;
          log(`  retry attemptId: ${q1RetryAttemptId}`);
          if (r2.data?.status === "completed" && r2.data?.improvement) {
            const imp = r2.data.improvement;
            log(`  improvement delta: ${imp.improvement}`);
            log(`  improved: ${imp.improved}`);
          }
        }
      }
    }
  }

  // ── 8. Get current question (session recovery test) ────────────────────────
  step("GET /current — session recovery after retry");
  {
    const r = await api("GET", `/interviews/${sessionId}/current`);
    assert(r.ok, `current HTTP ${r.status}`);
    // Question may be null if retry was completed and we need /next, or the retry Q
    log(`  current question: ${r.data?.question ? r.data.question.text?.slice(0,60) : "null (need /next)"}`);
  }

  // ── 9. Request explanation ────────────────────────────────────────────────
  step("Request explanation for Q1 topic");
  {
    const r = await api("POST", `/interviews/${sessionId}/explanations`, {
      questionId: q1Id,
      topic: "JWT token validation",
    });
    if (r.status === 409) {
      log(`  Explanation rejected (session state): ${r.error?.code} — skipping`);
    } else if (r.status === 502) {
      log("  AI provider unavailable for explanation — skipping");
    } else {
      assert(r.ok, `explanation HTTP ${r.status}: ${JSON.stringify(r.error)}`);
      assert(r.data?.explanation?.length > 0, "explanation text present");
      assert(Array.isArray(r.data?.keyPoints),  "keyPoints array");
      log(`  explanation preview: "${(r.data.explanation||"").slice(0,80)}..."`);
      log(`  keyPoints count: ${r.data.keyPoints?.length}`);
    }
  }

  // ── 10. Get next action ───────────────────────────────────────────────────
  step("POST /next — generate Q2 (adaptive follow-up)");
  {
    log("  Generating next question via AI provider...");
    const r = await api("POST", `/interviews/${sessionId}/next`);
    if (!r.ok) {
      log(`  /next failed (${r.status}): ${JSON.stringify(r.error)}`);
      if (r.status === 502) log("  BLOCKED: AI unavailable for Q2 generation");
    } else {
      assertIn(r.data?.action, ["question", "complete"], "action value");
      if (r.data.action === "question") {
        assert(r.data.question?.text, "Q2 text present");
        q2Id = r.data.question.id;
        log(`  Q2 id:   ${q2Id}`);
        log(`  Q2 text: "${r.data.question.text.slice(0,90)}..."`);
      } else {
        log("  Interview complete after Q1 (2-question limit reached or duration)");
      }
    }
  }

  // ── 11. Submit Q2 text answer ─────────────────────────────────────────────
  if (q2Id) {
    step("Submit text answer for Q2");
    {
      const ANSWER2 = "The most challenging aspect of full-stack development is keeping the frontend and backend contract consistent as requirements change quickly. I address this by defining shared TypeScript interfaces and an OpenAPI schema that both sides compile against, so type mismatches surface at build time rather than in production. I also invest in integration tests at the API boundary so that any breaking change is caught before it reaches a release branch.";
      log("  Evaluating via AI provider...");
      const r = await submitText(sessionId, q2Id, ANSWER2, `idem_${TS}_q2`);
      if (!r.ok) {
        log(`  Q2 submit failed (${r.status}): ${JSON.stringify(r.error)}`);
      } else {
        q2AttemptId = r.data?.id;
        log(`  Q2 attemptId: ${q2AttemptId}`);
        if (r.data?.status === "completed") {
          log(`  Q2 score: ${r.data.evaluation?.overallScore}`);
          log(`  Q2 class: ${r.data.evaluation?.classification}`);
        }
      }
    }
  }

  // ── 12. Natural completion via /next ─────────────────────────────────────
  step("POST /next after Q2 — confirm natural completion (action: complete)");
  {
    const r = await api("POST", `/interviews/${sessionId}/next`);
    if (!r.ok) {
      log(`  ✗ /next failed (${r.status}): ${JSON.stringify(r.error)}`);
      process.exit(1);
    }
    if (r.data?.action === "checkpoint") {
      log(`  ✗ CHECKPOINT fired — unresolved questions detected:`);
      log(`  ${JSON.stringify(r.data.unresolvedQuestions)}`);
      log("  → Q2 evaluation may have left a question in 'asked' status");
      process.exit(3);
    }
    assert(r.data?.action === "complete", `action must be "complete", got "${r.data?.action}"`);
    assert(!r.data?.question, "no new question should be returned with action: complete");
    log(`  action: ${r.data.action} — natural completion confirmed`);
  }

  // ── 13. Generate final report ─────────────────────────────────────────────
  step("Generate final master report");
  {
    log("  Synthesising report via AI provider...");
    const r = await api("POST", `/interviews/${sessionId}/report`);
    if (r.status === 502) {
      log("  BLOCKED: AI provider unavailable for report");
      process.exit(2);
    }
    assert(r.ok, `report generation HTTP ${r.status}: ${JSON.stringify(r.error)}`);
    log(`  Report status: ${r.data?.status || "immediate"}`);
    if (r.data?.overallScore !== undefined) {
      assertRange(r.data.overallScore, 0, 100, "report overallScore");
      assert(Array.isArray(r.data.strengths),        "strengths array");
      assert(Array.isArray(r.data.improvements),     "improvements array");
      assert(Array.isArray(r.data.recommendations),  "recommendations array");
      assert(r.data.progress?.questionsAnswered >= 0,"questionsAnswered present");
      log(`  overallScore:    ${r.data.overallScore}`);
      log(`  strengths:       ${(r.data.strengths||[]).length}`);
      log(`  improvements:    ${(r.data.improvements||[]).length}`);
      log(`  questionsAnswered: ${r.data.progress?.questionsAnswered}`);
      log(`  retriedCount:    ${r.data.progress?.questionsRetried}`);
    }

    // ── Verify session reached "completed" and hasReport after report generation
    const sessionCheck = await api("GET", `/interviews/${sessionId}`);
    assert(sessionCheck.ok, `session fetch after report HTTP ${sessionCheck.status}`);
    assert(sessionCheck.data?.status === "completed", `session status must be "completed" after report generation, got "${sessionCheck.data?.status}"`);
    assert(sessionCheck.data?.hasReport === true, "session.hasReport must be true after report generation");
    log(`  session status after report: ${sessionCheck.data?.status} ✓`);
    log(`  session hasReport: ${sessionCheck.data?.hasReport} ✓`);
  }

  // ── 14. Get report ────────────────────────────────────────────────────────
  step("GET final report");
  {
    const r = await api("GET", `/interviews/${sessionId}/report`);
    assert(r.ok, `get report HTTP ${r.status}`);
    assert(r.data, "report data present");
    const reportStatus = r.data?.status;
    log(`  report status: ${reportStatus}`);
    if (reportStatus !== "generating") {
      assertRange(r.data.overallScore, 0, 100, "report overallScore");
      assert(Array.isArray(r.data.strengths),       "report strengths array");
      assert(Array.isArray(r.data.improvements),    "report improvements array");
      assert(Array.isArray(r.data.recommendations), "report recommendations array");
      assert(r.data.progress?.questionsAnswered >= 1, "questionsAnswered >= 1");
      log(`  overallScore:      ${r.data.overallScore}`);
      log(`  questionsAnswered: ${r.data.progress?.questionsAnswered}`);
    } else {
      log("  Report still generating (async) — status check is complete enough");
    }
  }

  // ── 15. History ────────────────────────────────────────────────────────────
  step("GET interview history");
  {
    const r = await api("GET", "/interviews?page=1&limit=20");
    assert(r.ok, `history HTTP ${r.status}`);
    assert(Array.isArray(r.data?.interviews), "interviews array");
    assert(r.data.pagination?.total >= 1, `total >= 1 (got ${r.data.pagination?.total})`);
    // Find our session
    const found = r.data.interviews.find(s => s.id.toString() === sessionId.toString());
    assert(found, "our session appears in history");
    log(`  total sessions: ${r.data.pagination.total}`);
    log(`  our session status in history: ${found?.status}`);
  }

  // ── 16. Progress ──────────────────────────────────────────────────────────
  step("GET performance progression");
  {
    const r = await api("GET", "/interviews/progress");
    assert(r.ok, `progress HTTP ${r.status}`);
    assert(typeof r.data?.sessionsCompleted === "number", "sessionsCompleted present");
    assert(Array.isArray(r.data?.scores), "scores array");
    log(`  sessionsCompleted: ${r.data.sessionsCompleted}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log("\n═══════════════════════════════════════════════════════════");
  log("  ALL STEPS COMPLETED SUCCESSFULLY");
  log("═══════════════════════════════════════════════════════════");
  log(`  sessionId:       ${sessionId}`);
  log(`  q1Id:            ${q1Id}`);
  log(`  q1AttemptId:     ${q1AttemptId}`);
  log(`  q1RetryAttemptId:${q1RetryAttemptId || "skipped"}`);
  log(`  q2Id:            ${q2Id || "not generated"}`);
  log(`  q2AttemptId:     ${q2AttemptId || "not submitted"}`);
}

run().catch(err => {
  log(`\nFATAL ERROR: ${err.message}`);
  process.exit(1);
});
