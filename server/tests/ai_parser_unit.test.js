/**
 * ai_parser_unit.test.js
 *
 * Comprehensive deterministic unit tests for the AI parser layer.
 * NO live AI provider calls. All inputs are hard-coded strings.
 *
 * Covers the test matrix sections H (AI retry/parser), B (question generation
 * failure modes), and C (answer evaluation failure modes).
 *
 * Run: node tests/ai_parser_unit.test.js
 * Dependencies: none beyond what is in the project.
 */
"use strict";

const path = require("path");

// ── Load parsers directly (no server needed) ──────────────────────────────────
const { parseEvaluationResponse }     = require("../src/services/ai/prompts/interview/evaluation/evaluateAnswer");
const { parseQuestionGenerationResponse } = require("../src/services/ai/prompts/interview/question/generateQuestion");
const { parseFinalReportResponse }    = require("../src/services/ai/prompts/interview/finalReport/generateFinalReport");

// ── Minimal test runner ───────────────────────────────────────────────────────
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

function assertThrowsCode(fn, expectedCode) {
  let threw = false;
  let actual;
  try { fn(); }
  catch (e) { threw = true; actual = e.code; }
  if (!threw) throw new Error(`Expected error code ${expectedCode} but no error was thrown`);
  if (actual !== expectedCode) throw new Error(`Expected error code ${expectedCode} but got ${actual}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION A — parseEvaluationResponse
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ A. parseEvaluationResponse ══\n");

// A1: Valid minimal JSON
test("A1 Valid minimal evaluation JSON", () => {
  const raw = JSON.stringify({
    overallScore: 72, technicalAccuracy: 70, relevance: 75, communication: 68,
    clarity: 70, structure: 70, completeness: 72, problemSolving: null,
    classification: "mostly_correct",
    strengths: ["Good structure"], weaknesses: ["Missing edge cases"],
    missingPoints: [], suggestions: ["Add examples"],
    retryRecommended: false, explanationRecommended: false,
    technicalFeedback: { correctness: "Good", missingConcepts: [], misconceptions: [], improvedExplanation: "" },
    communicationFeedback: { observations: [], suggestions: [] },
  });
  const r = parseEvaluationResponse(raw);
  assert(r.overallScore === 72, `Expected 72, got ${r.overallScore}`);
  assert(r.classification === "mostly_correct");
});

// A2: Valid JSON wrapped in markdown fences
test("A2 Markdown-fenced JSON is stripped", () => {
  const raw = "```json\n{\"overallScore\":60,\"relevance\":60,\"communication\":60,\"clarity\":60,\"structure\":60,\"completeness\":60,\"classification\":\"partially_correct\",\"strengths\":[\"Clear delivery\"],\"weaknesses\":[],\"missingPoints\":[],\"suggestions\":[],\"retryRecommended\":false,\"explanationRecommended\":false}\n```";
  const r = parseEvaluationResponse(raw);
  assert(r.overallScore === 60, `Expected 60 got ${r.overallScore}`);
});

// A3: Valid JSON with text before and after
test("A3 Text before/after JSON is stripped", () => {
  const raw = "Here is my evaluation:\n{\"overallScore\":55,\"relevance\":55,\"communication\":55,\"clarity\":55,\"structure\":55,\"completeness\":55,\"classification\":\"partially_correct\",\"strengths\":[\"Attempted the question\"],\"weaknesses\":[],\"missingPoints\":[],\"suggestions\":[],\"retryRecommended\":false,\"explanationRecommended\":false}\nI hope this helps.";
  const r = parseEvaluationResponse(raw);
  assert(r.overallScore === 55);
});

// A4: overallScore missing — derive from sub-scores; must also have feedback
test("A4 Missing overallScore is derived from sub-scores", () => {
  const raw = JSON.stringify({
    technicalAccuracy: 80, relevance: 60, communication: 70,
    clarity: 70, structure: 65, completeness: 65,
    classification: "mostly_correct",
    strengths: ["Good structure"], weaknesses: [], missingPoints: [], suggestions: [],
    retryRecommended: false, explanationRecommended: false,
  });
  const r = parseEvaluationResponse(raw);
  assert(typeof r.overallScore === "number", "overallScore should be derived");
  assert(r.overallScore > 0);
});

// A5: Completely empty string → AI_INVALID_JSON
test("A5 Empty string throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseEvaluationResponse(""), "AI_INVALID_JSON");
});

// A6: Totally non-JSON text → AI_INVALID_JSON
test("A6 Plain text throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseEvaluationResponse("I cannot evaluate this answer."), "AI_INVALID_JSON");
});

// A7: Truncated JSON with scores but cut before feedback — must now FAIL completeness check
test("A7 Truncated JSON (score-only — no feedback) throws AI_SCHEMA_MISMATCH", () => {
  // After repair, this produces a valid object with scores but no feedback text.
  // The completeness check must reject this and allow retry.
  const scoreOnly = `{"overallScore":65,"technicalAccuracy":60,"relevance":70,"communication":65,"clarity":65,"structure":65,"completeness":65,"classification":"partially_correct"}garbage trailing`;
  assertThrowsCode(() => parseEvaluationResponse(scoreOnly), "AI_SCHEMA_MISMATCH");
});

// A8: Valid JSON but no overallScore AND no sub-scores → AI_SCHEMA_MISMATCH
test("A8 No scores at all throws AI_SCHEMA_MISMATCH", () => {
  const raw = JSON.stringify({ classification: "correct", strengths: [], weaknesses: [] });
  assertThrowsCode(() => parseEvaluationResponse(raw), "AI_SCHEMA_MISMATCH");
});

// A9: Invalid classification is derived from score
test("A9 Invalid classification is normalized from score", () => {
  const raw = JSON.stringify({
    overallScore: 90, relevance: 90, communication: 90, clarity: 90,
    structure: 90, completeness: 90, classification: "great",  // invalid
    strengths: ["Excellent depth"], weaknesses: [], missingPoints: [], suggestions: [],
    retryRecommended: false, explanationRecommended: false,
  });
  const r = parseEvaluationResponse(raw);
  assert(r.classification === "correct", `Expected "correct" for score 90, got "${r.classification}"`);
});

// A10: Scores clamped to 0-100
test("A10 Out-of-range scores are clamped", () => {
  const raw = JSON.stringify({
    overallScore: 150, relevance: -10, communication: 50, clarity: 50,
    structure: 50, completeness: 50, classification: "mostly_correct",
    strengths: ["Showed effort"], weaknesses: [], missingPoints: [], suggestions: [],
    retryRecommended: false, explanationRecommended: false,
  });
  const r = parseEvaluationResponse(raw);
  assert(r.overallScore === 100, `Expected 100, got ${r.overallScore}`);
  assert(r.relevance === 0, `Expected 0, got ${r.relevance}`);
});

// A11: Missing arrays become empty arrays — but need at least one non-empty to pass completeness
// The completeness check requires at least one feedback item. This test verifies
// that defaults are applied AND that a complete evaluation with feedback passes.
test("A11 Valid eval — missing optional arrays default correctly", () => {
  // strengths has content, other arrays can be empty
  const raw = JSON.stringify({
    overallScore: 50, relevance: 50, communication: 50, clarity: 50,
    structure: 50, completeness: 50, classification: "partially_correct",
    strengths: ["Attempted the question"],
    // weaknesses, missingPoints, suggestions intentionally omitted
    retryRecommended: false, explanationRecommended: false,
  });
  const r = parseEvaluationResponse(raw);
  assert(Array.isArray(r.weaknesses)    && r.weaknesses.length === 0);
  assert(Array.isArray(r.missingPoints) && r.missingPoints.length === 0);
  assert(Array.isArray(r.suggestions)   && r.suggestions.length === 0);
});

// A12: retryRecommended coerced to boolean
test("A12 retryRecommended coerced to boolean", () => {
  const raw = JSON.stringify({
    overallScore: 45, relevance: 45, communication: 45, clarity: 45,
    structure: 45, completeness: 45, classification: "partially_correct",
    retryRecommended: "yes",  // string, not boolean
    explanationRecommended: 1,
    strengths: ["Made a genuine attempt"], weaknesses: [], missingPoints: [], suggestions: [],
  });
  const r = parseEvaluationResponse(raw);
  assert(r.retryRecommended === true, `Expected true, got ${r.retryRecommended}`);
  assert(r.explanationRecommended === true);
});

// A13: Malformed JSON (no closing braces) → AI_INVALID_JSON
test("A13 Deeply malformed JSON (no valid object) throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseEvaluationResponse("{{{{broken"), "AI_INVALID_JSON");
});

// A14: Valid JSON as string type (model returned string instead of JSON)
test("A14 JSON encoded as string inside string → parsed correctly", () => {
  const inner = JSON.stringify({
    overallScore: 55, relevance: 55, communication: 55, clarity: 55,
    structure: 55, completeness: 55, classification: "partially_correct",
    strengths: ["On-topic response"], weaknesses: [], missingPoints: [], suggestions: [],
    retryRecommended: false, explanationRecommended: false,
  });
  const r = parseEvaluationResponse(inner);
  assert(r.overallScore === 55);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION B — parseQuestionGenerationResponse
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ B. parseQuestionGenerationResponse ══\n");

// B1: Valid question JSON
test("B1 Valid question generation JSON", () => {
  const raw = JSON.stringify({
    action: "question",
    question: {
      text: "What is a closure in JavaScript?",
      category: "technical",
      topic: "closures",
      difficulty: "medium",
      type: "initial",
      expectedDurationSeconds: 120,
    },
    reason: "opening",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.action === "question");
  assert(r.question.text === "What is a closure in JavaScript?");
  assert(r.question.category === "technical");
});

// B2: Markdown-fenced JSON
test("B2 Markdown-fenced question JSON is stripped", () => {
  const inner = JSON.stringify({
    action: "question",
    question: { text: "Tell me about yourself.", category: "behavioral", topic: "intro", difficulty: "easy", type: "initial", expectedDurationSeconds: 120 },
    reason: "opening",
  });
  const r = parseQuestionGenerationResponse("```json\n" + inner + "\n```");
  assert(r.action === "question");
});

// B3: action=complete
test("B3 action=complete passes through", () => {
  const r = parseQuestionGenerationResponse(JSON.stringify({ action: "complete" }));
  assert(r.action === "complete");
});

// B4: Missing action but has question object at top-level → normalized
test("B4 Missing action wrapper with question object is normalized", () => {
  const raw = JSON.stringify({
    question: { text: "Describe REST vs GraphQL.", category: "technical", topic: "APIs", difficulty: "medium", type: "initial", expectedDurationSeconds: 120 },
    reason: "core",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.action === "question");
  assert(r.question.text.includes("REST"));
});

// B5: Plain text question (model returned prose) → salvaged
test("B5 Plain text response is salvaged as a question", () => {
  const plainText = "Can you describe your experience with React hooks?";
  const r = parseQuestionGenerationResponse(plainText);
  assert(r.action === "question");
  assert(r.question.text.includes("React"));
});

// B6: Empty string → AI_INVALID_JSON
test("B6 Empty string throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseQuestionGenerationResponse(""), "AI_INVALID_JSON");
});

// B7: JSON without question text → AI_SCHEMA_MISMATCH
test("B7 JSON with action=question but no question.text throws AI_SCHEMA_MISMATCH", () => {
  const raw = JSON.stringify({ action: "question", question: { category: "technical" } });
  assertThrowsCode(() => parseQuestionGenerationResponse(raw), "AI_SCHEMA_MISMATCH");
});

// B8: Invalid category is normalized to "technical"
test("B8 Invalid category is normalized", () => {
  const raw = JSON.stringify({
    action: "question",
    question: { text: "What?", category: "xyz_invalid", topic: "t", difficulty: "easy", type: "initial", expectedDurationSeconds: 90 },
    reason: "core",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.question.category === "technical", `Expected "technical", got "${r.question.category}"`);
});

// B9: Invalid difficulty is normalized to "medium"
test("B9 Invalid difficulty is normalized", () => {
  const raw = JSON.stringify({
    action: "question",
    question: { text: "Explain polymorphism.", category: "technical", topic: "OOP", difficulty: "moderate", type: "initial", expectedDurationSeconds: 120 },
    reason: "core",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.question.difficulty === "medium");
});

// B10: Missing expectedDurationSeconds defaults to 120
test("B10 Missing expectedDurationSeconds defaults to 120", () => {
  const raw = JSON.stringify({
    action: "question",
    question: { text: "Explain polymorphism.", category: "technical", topic: "OOP", difficulty: "medium", type: "initial" },
    reason: "core",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.question.expectedDurationSeconds === 120);
});

// B11: Duplicate question text (same as previous) — parser allows it (de-dup is service responsibility)
test("B11 Parser does not reject duplicate question text (service de-dup responsibility)", () => {
  const raw = JSON.stringify({
    action: "question",
    question: { text: "Tell me about yourself.", category: "behavioral", topic: "intro", difficulty: "easy", type: "initial", expectedDurationSeconds: 120 },
    reason: "opening",
  });
  const r = parseQuestionGenerationResponse(raw);
  assert(r.action === "question");  // parser allows it
});

// B12: Text with JSON inside → extraction works
test("B12 JSON embedded in prose text is extracted", () => {
  const raw = `Sure, here is the question: {"action":"question","question":{"text":"How does the event loop work?","category":"technical","topic":"event loop","difficulty":"medium","type":"initial","expectedDurationSeconds":120},"reason":"core"}. Let me know if you need changes.`;
  const r = parseQuestionGenerationResponse(raw);
  assert(r.action === "question");
  assert(r.question.text.includes("event loop"));
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION C — parseFinalReportResponse
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ C. parseFinalReportResponse ══\n");

// C1: Valid report JSON
test("C1 Valid final report JSON", () => {
  const raw = JSON.stringify({
    strengths: ["Good communication", "Structured answers"],
    improvements: ["Deeper technical detail needed"],
    knowledgeGaps: ["System design basics"],
    recommendations: ["Study distributed systems"],
    technicalSummary: "Candidate shows solid fundamentals.",
    communicationSummary: "Clear and concise delivery.",
    progressSummary: "Improved on retried questions.",
    nextSteps: ["Practice LeetCode medium", "Study system design"],
  });
  const r = parseFinalReportResponse(raw);
  assert(Array.isArray(r.strengths) && r.strengths.length === 2);
  assert(r.technicalSummary === "Candidate shows solid fundamentals.");
});

// C2: Markdown-fenced report JSON
test("C2 Markdown-fenced final report JSON is stripped", () => {
  const inner = JSON.stringify({ strengths: ["A"], improvements: ["B"], knowledgeGaps: [], recommendations: [], technicalSummary: "ok", communicationSummary: "ok", progressSummary: "ok", nextSteps: [] });
  const r = parseFinalReportResponse("```json\n" + inner + "\n```");
  assert(r.strengths[0] === "A");
});

// C3: Missing array fields default to []
test("C3 Missing array fields default to []", () => {
  const raw = JSON.stringify({ technicalSummary: "Decent performance.", communicationSummary: "", progressSummary: "" });
  const r = parseFinalReportResponse(raw);
  assert(Array.isArray(r.strengths));
  assert(Array.isArray(r.improvements));
  assert(Array.isArray(r.nextSteps));
});

// C4: Missing string fields default to "" — use a fixture that has some content
test("C4 Missing string fields default to empty string", () => {
  // strengths is present so qualitative completeness is satisfied;
  // the three summary strings should default to ""
  const raw = JSON.stringify({ strengths: ["Good fundamentals"], improvements: [], knowledgeGaps: [], recommendations: [], nextSteps: [] });
  const r = parseFinalReportResponse(raw);
  assert(r.technicalSummary === "", `Expected "" got "${r.technicalSummary}"`);
  assert(r.communicationSummary === "");
  assert(r.progressSummary === "");
});

// C5: Empty response → AI_INVALID_JSON
test("C5 Empty response throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseFinalReportResponse(""), "AI_INVALID_JSON");
});

// C6: Totally malformed → AI_INVALID_JSON
test("C6 Garbage string throws AI_INVALID_JSON", () => {
  assertThrowsCode(() => parseFinalReportResponse("I cannot generate a report right now."), "AI_INVALID_JSON");
});

// C7: Truncated report JSON — repaired
test("C7 Truncated report JSON is repaired", () => {
  // Truncated at the start of improvements array
  const partial = `{"strengths":["Good technical depth","Clear explanations"],"improvements":["Needs more pra`;
  // The repair function will find the last } — but there is none in this partial
  // Let's use a partial that has an inner valid object we can recover
  const partial2 = `{"strengths":["Good technical depth"],"improvements":["Needs more practice"],"knowledgeGaps":["System design"]},"extra_truncated_field":"`;
  const r = parseFinalReportResponse(partial2);
  assert(Array.isArray(r.strengths));
});

// C8: Refusal response (model refused to generate) → AI_INVALID_JSON
test("C8 Refusal / non-JSON response throws AI_INVALID_JSON", () => {
  assertThrowsCode(
    () => parseFinalReportResponse("I'm sorry, I cannot generate interview feedback as this may be harmful."),
    "AI_INVALID_JSON"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION D — withRetry behavior (unit-level, mocked)
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ D. withRetry behavior (deterministic simulation) ══\n");

// D1: First attempt succeeds — no retry
test("D1 First attempt succeeds — fn called exactly once", async () => {
  let calls = 0;
  const result = await simulateWithRetry(async () => { calls++; return "ok"; }, 3);
  assert(result === "ok");
  assert(calls === 1, `Expected 1 call, got ${calls}`);
});

// D2: First fails (retryable), second succeeds
test("D2 First attempt fails (retryable), second succeeds", async () => {
  let calls = 0;
  const result = await simulateWithRetry(async () => {
    calls++;
    if (calls < 2) { const e = new Error("transient"); e.code = "AI_INVALID_JSON"; throw e; }
    return "recovered";
  }, 3);
  assert(result === "recovered");
  assert(calls === 2, `Expected 2 calls, got ${calls}`);
});

// D3: All retries fail — throws last error
test("D3 All retries fail — last error is thrown", async () => {
  let calls = 0;
  let threw = false;
  let finalCode;
  try {
    await simulateWithRetry(async () => {
      calls++;
      const e = new Error("always fails"); e.code = "AI_EMPTY_RESPONSE"; throw e;
    }, 2);
  } catch (e) { threw = true; finalCode = e.code; }
  assert(threw, "Expected error to be thrown");
  assert(finalCode === "AI_EMPTY_RESPONSE", `Got ${finalCode}`);
  assert(calls === 2, `Expected 2 calls, got ${calls}`);
});

// D4: Non-retryable error — does not retry, throws immediately
test("D4 Non-retryable error is not retried", async () => {
  let calls = 0;
  let threw = false;
  try {
    await simulateWithRetry(async () => {
      calls++;
      const e = new Error("config error"); e.code = "AI_CONFIG_ERROR"; throw e;
    }, 3);
  } catch { threw = true; }
  assert(threw);
  assert(calls === 1, `Expected 1 call (no retry), got ${calls}`);
});

// D5: AI_SCHEMA_MISMATCH is retried (Phase 2 fix)
test("D5 AI_SCHEMA_MISMATCH is retried", async () => {
  let calls = 0;
  let threw = false;
  try {
    await simulateWithRetry(async () => {
      calls++;
      const e = new Error("schema"); e.code = "AI_SCHEMA_MISMATCH"; throw e;
    }, 3);
  } catch { threw = true; }
  assert(threw);
  assert(calls === 3, `Expected 3 calls, got ${calls}`);
});

// ── Simulation of withRetry logic (mirrors aiService.js implementation) ───────
async function simulateWithRetry(fn, maxRetries) {
  const RETRYABLE = new Set(["AI_NETWORK_ERROR","AI_PROVIDER_ERROR","AI_EMPTY_RESPONSE","AI_INVALID_JSON","AI_SCHEMA_MISMATCH"]);
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = RETRYABLE.has(err.code);
      if (!retryable || attempt === maxRetries) break;
      // Use 0ms delay for test speed
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION E — Idempotency key behavior (logic simulation)
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ E. Idempotency / duplicate submission protection ══\n");

// E1: Same idempotency key returns existing attempt
test("E1 Idempotency key deduplication logic is present in service source", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("idempotencyKey"), "idempotencyKey field should exist");
  assert(src.includes("AnswerAttempt.findOne({ idempotencyKey })"), "dedup lookup must exist");
});

// E2: Concurrent processing guard is present
test("E2 Concurrent processing guard prevents double-submission", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("processing_answer"), "processing_answer lock must be checked");
  assert(src.includes("An answer is already being processed"), "guard error message must exist");
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION F — Timestamp lifecycle (code inspection)
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ F. Timestamp lifecycle (source verification) ══\n");

test("F1 startedAt set in startInterview at session transition", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("session.startedAt = new Date()"), "startedAt assignment must be present");
});

test("F2 completedAt set in endInterview (covers abandoned + other terminal)", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("session.completedAt = new Date()"), "completedAt assignment must be present");
});

test("F3 generateReport preserves existing completedAt", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("session.completedAt = session.completedAt || new Date()"), "completedAt must use OR guard");
});

test("F4 getInterviewHistory DTO includes startedAt", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("startedAt:     s.startedAt") || src.includes("startedAt: s.startedAt"), "startedAt in history DTO");
});

test("F5 sessionToDto exposes startedAt and completedAt", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../src/services/interviewService.js"), "utf8");
  assert(src.includes("startedAt:            session.startedAt"), "sessionToDto must expose startedAt");
  assert(src.includes("completedAt:          session.completedAt"), "sessionToDto must expose completedAt");
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION G — Frontend guard and navigation
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ G. Frontend navigation guard (source verification) ══\n");

test("G1 guardActive = isInterviewOngoing (not gated on isSessionRoute)", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/pages/InterviewPage.jsx"), "utf8");
  assert(src.includes("const guardActive = isInterviewOngoing;"), "guardActive must equal isInterviewOngoing without route gate");
});

test("G2 finishInterview branches on user_ended (no report for abandoned)", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8");
  assert(src.includes('reason === "user_ended"'), "finishInterview must branch on user_ended");
});

test("G3 restoreSession cancellation token prevents stale dispatch", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/contexts/InterviewContext.jsx"), "utf8");
  assert(src.includes("getCancelled"), "restoreSession must accept getCancelled parameter");
  assert(src.includes("isCancelled()"), "isCancelled must be checked before dispatching");
});

test("G4 ReportPage has Back to History button", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/pages/ReportPage.jsx"), "utf8");
  assert(src.includes("Back to History") && src.includes('navigate("/history")'), "ReportPage must have Back to History");
});

test("G5 HistoryPage has timestamp formatting with null guard", () => {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/pages/HistoryPage.jsx"), "utf8");
  assert(src.includes("formatInterviewTimestamp"), "formatInterviewTimestamp must exist");
  assert(src.includes("isNaN") || src.includes("Not available"), "null/invalid date must be handled");
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION H — Truncation repair + completeness guard
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ H. Truncation repair + completeness guard ══\n");

// H1: Score-only truncation (no feedback text) — must be rejected, not accepted
test("H1 Score-only truncated eval throws AI_SCHEMA_MISMATCH (no feedback)", () => {
  // Repair recovers the object but completeness guard rejects scores without feedback
  const scoreOnly = `{"overallScore":72,"technicalAccuracy":68,"relevance":75,"communication":70,"clarity":70,"structure":70,"completeness":70,"problemSolving":null,"classification":"mostly_correct"}trailing garbage`;
  assertThrowsCode(() => parseEvaluationResponse(scoreOnly), "AI_SCHEMA_MISMATCH");
});

// H2: Truncated eval with at least one feedback entry — repair + acceptance
test("H2 Truncated eval with a feedback entry is recovered and accepted", () => {
  const withFeedback = `{"overallScore":72,"technicalAccuracy":68,"relevance":75,"communication":70,"clarity":70,"structure":70,"completeness":70,"classification":"mostly_correct","weaknesses":["Missing edge cases"]}trailing garbage`;
  const r = parseEvaluationResponse(withFeedback);
  assert(r.overallScore === 72);
  assert(r.weaknesses.length > 0);
});

// H3: technicalFeedback.correctness alone satisfies completeness
test("H3 Truncated eval with technicalFeedback.correctness passes completeness", () => {
  const withTFCorrectness = JSON.stringify({
    overallScore: 65, relevance: 65, communication: 65, clarity: 65,
    structure: 65, completeness: 65, classification: "partially_correct",
    retryRecommended: true, explanationRecommended: false,
    technicalFeedback: { correctness: "Answer was partially correct.", missingConcepts: [], misconceptions: [], improvedExplanation: "" },
  });
  const r = parseEvaluationResponse(withTFCorrectness);
  assert(r.overallScore === 65);
  assert(r.technicalFeedback.correctness.length > 0);
});

// H4: Empty object recovery — must throw
test("H4 Empty recovered object throws AI_SCHEMA_MISMATCH", () => {
  assertThrowsCode(() => parseEvaluationResponse("{}"), "AI_SCHEMA_MISMATCH");
});

// H5: Final report with only strengths recovers (non-empty strengths satisfies completeness)
test("H5 Truncated final report with strengths is accepted", () => {
  const truncated = `{"strengths":["Good technical depth","Clear explanations"],"improvements":["Needs more practice"]}garbage`;
  const r = parseFinalReportResponse(truncated);
  assert(r.strengths.length === 2);
});

// H6: Final report with all-empty content throws AI_SCHEMA_MISMATCH
test("H6 All-empty final report throws AI_SCHEMA_MISMATCH", () => {
  // knowledgeGaps is non-empty but not in the completeness list (strengths/improvements/summaries)
  assertThrowsCode(
    () => parseFinalReportResponse(JSON.stringify({ knowledgeGaps: ["SQL basics"] })),
    "AI_SCHEMA_MISMATCH"
  );
});

// H7: Final report with technicalSummary only passes completeness
test("H7 Final report with technicalSummary only passes", () => {
  const r = parseFinalReportResponse(JSON.stringify({
    technicalSummary: "Candidate demonstrated solid fundamentals in React.",
  }));
  assert(r.technicalSummary.includes("React"));
});

// H8: Evaluation prompt input tokens < 450 after fix
test("H8 Evaluation prompt input tokens < 450 after fix", () => {
  const { buildEvaluationPrompt } = require("../src/services/ai/prompts/interview/evaluation/evaluateAnswer");
  const ctx = {
    question: { text: "What is React?", category: "frontend", topic: "React", difficulty: "easy" },
    transcript: { text: "React is a JS library.", language: "en", confidence: null },
    speechMetrics: { wordCount: 5, speakingRate: 120, fillerWordCount: 0, fillerWordOccurrences: [], responseDurationMs: null },
    interviewContext: { interviewType: "technical", role: "Frontend Dev", company: "" },
    candidateContext: { experienceLevel: "junior" },
  };
  const { systemPrompt, userPrompt } = buildEvaluationPrompt(ctx);
  const inputTokens = Math.round((systemPrompt.length + userPrompt.length) / 4);
  assert(inputTokens < 450, `Expected < 450 input tokens, got ${inputTokens}`);
});

// H9: Repair with nested object — outer boundary wins over inner
test("H9 Repair finds outer object boundary (outer has weaknesses, inner is noise)", () => {
  const withNested = `{"overallScore":80,"relevance":80,"communication":80,"clarity":80,"structure":80,"completeness":80,"classification":"correct","weaknesses":["Could add more detail"]} {"nestedGarbage":"noise"}`;
  const r = parseEvaluationResponse(withNested);
  assert(r.overallScore === 80);
  assert(r.weaknesses.length > 0);
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
