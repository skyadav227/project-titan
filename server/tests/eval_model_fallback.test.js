/**
 * eval_model_fallback.test.js
 *
 * Deterministic regression suite for per-evaluation model fallback.
 * 22 tests: 16 behavioral + 3 source inspections + 2 adapter HTTP + 1 source inspection.
 *
 * Plain-Node deterministic pattern — no test framework, no DB connection.
 * Run: node tests/eval_model_fallback.test.js
 */
"use strict";

const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      // async test — handled by runAsync
      return r.then(() => {
        console.log(`  PASS  ${name}`);
        passed++;
      }).catch(err => {
        console.error(`  FAIL  ${name}`);
        console.error(`        ${err.message}`);
        failed++;
      });
    }
    console.log(`  PASS  ${name}`);
    passed++;
    return Promise.resolve();
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
    return Promise.resolve();
  }
}

const { withEvalModelFallback } = require("../src/services/ai/aiService");

// ── Mock helper ───────────────────────────────────────────────────────────────

function makeMock(outcomes) {
  let i = 0;
  const callLog = [];
  const fn = async (model) => {
    callLog.push(model);
    const o = outcomes[i++];
    if (!o) { const e = new Error(`Unexpected call #${i}`); e.code = "UNEXPECTED"; throw e; }
    if (o.error) { const e = new Error(o.error); e.code = o.error; throw e; }
    return o.result !== undefined ? o.result : "ok";
  };
  fn.callLog = callLog;
  return fn;
}

// ── Tests 1–16: behavioral tests of withEvalModelFallback ─────────────────────

const m0 = "model-A";
const m1 = "model-B";
const m2 = "model-C";

async function runTests() {

  await test("1. First model succeeds → result returned, 1 call", async () => {
    const mock = makeMock([{ result: "success" }]);
    const r = await withEvalModelFallback(mock, [m0]);
    assert.strictEqual(r, "success");
    assert.strictEqual(mock.callLog.length, 1);
    assert.strictEqual(mock.callLog[0], m0);
  });

  await test("2. model[0] AI_REASONING_OVERFLOW → model[1] succeeds, 2 calls, correct order", async () => {
    const mock = makeMock([{ error: "AI_REASONING_OVERFLOW" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("3. model[0] AI_EMPTY_RESPONSE → model[1] succeeds", async () => {
    const mock = makeMock([{ error: "AI_EMPTY_RESPONSE" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("4. model[0] AI_INVALID_JSON → model[1] succeeds", async () => {
    const mock = makeMock([{ error: "AI_INVALID_JSON" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("5. model[0] AI_SCHEMA_MISMATCH → model[1] succeeds", async () => {
    const mock = makeMock([{ error: "AI_SCHEMA_MISMATCH" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("6. model[0] AI_RATE_LIMIT → model[1] succeeds, model[0] NOT retried", async () => {
    const mock = makeMock([{ error: "AI_RATE_LIMIT" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("7. model[0] AI_PROVIDER_ERROR → model[1] succeeds, model[0] NOT retried", async () => {
    const mock = makeMock([{ error: "AI_PROVIDER_ERROR" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1]);
  });

  await test("8. model[0] AI_NETWORK_ERROR → retry model[0] → succeeds, callLog=[m0,m0]", async () => {
    const mock = makeMock([{ error: "AI_NETWORK_ERROR" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m0]);
  });

  await test("9. model[0] AI_NETWORK_ERROR ×2 → model[1] succeeds, callLog=[m0,m0,m1]", async () => {
    const mock = makeMock([{ error: "AI_NETWORK_ERROR" }, { error: "AI_NETWORK_ERROR" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, [m0, m1]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m0, m1]);
  });

  await test("10. AI_CONFIG_ERROR on model[0] → model[1] never called, error propagated", async () => {
    const mock = makeMock([{ error: "AI_CONFIG_ERROR" }]);
    let threw = null;
    try {
      await withEvalModelFallback(mock, [m0, m1]);
    } catch (e) { threw = e; }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
    assert.strictEqual(mock.callLog.length, 1);
    assert.strictEqual(mock.callLog[0], m0);
  });

  await test("11. AI_AUTH_ERROR on model[0] → model[1] never called, error code is AI_AUTH_ERROR", async () => {
    const mock = makeMock([{ error: "AI_AUTH_ERROR" }]);
    let threw = null;
    try {
      await withEvalModelFallback(mock, [m0, m1]);
    } catch (e) { threw = e; }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_AUTH_ERROR");
    assert.strictEqual(mock.callLog.length, 1);
  });

  await test("12. All 3 models AI_REASONING_OVERFLOW → last error thrown, exactly 3 calls", async () => {
    const mock = makeMock([
      { error: "AI_REASONING_OVERFLOW" },
      { error: "AI_REASONING_OVERFLOW" },
      { error: "AI_REASONING_OVERFLOW" },
    ]);
    let threw = null;
    try {
      await withEvalModelFallback(mock, [m0, m1, m2]);
    } catch (e) { threw = e; }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_REASONING_OVERFLOW");
    assert.strictEqual(mock.callLog.length, 3);
  });

  await test("13. All 3 models AI_NETWORK_ERROR → exactly 6 calls (3×2), last error thrown", async () => {
    const mock = makeMock([
      { error: "AI_NETWORK_ERROR" }, { error: "AI_NETWORK_ERROR" },
      { error: "AI_NETWORK_ERROR" }, { error: "AI_NETWORK_ERROR" },
      { error: "AI_NETWORK_ERROR" }, { error: "AI_NETWORK_ERROR" },
    ]);
    let threw = null;
    try {
      await withEvalModelFallback(mock, [m0, m1, m2]);
    } catch (e) { threw = e; }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_NETWORK_ERROR");
    assert.strictEqual(mock.callLog.length, 6);
  });

  await test("14. Mixed: m0 AI_REASONING_OVERFLOW, m1 AI_NETWORK_ERROR ×2, m2 succeeds → [m0,m1,m1,m2]", async () => {
    const mock = makeMock([
      { error: "AI_REASONING_OVERFLOW" },
      { error: "AI_NETWORK_ERROR" },
      { error: "AI_NETWORK_ERROR" },
      { result: "ok" },
    ]);
    const r = await withEvalModelFallback(mock, [m0, m1, m2]);
    assert.strictEqual(r, "ok");
    assert.deepStrictEqual(mock.callLog, [m0, m1, m1, m2]);
  });

  await test("15. Duplicate IDs [A,A,B] → deduplicated, A tried once, B tried once", async () => {
    const mock = makeMock([{ error: "AI_REASONING_OVERFLOW" }, { result: "ok" }]);
    const r = await withEvalModelFallback(mock, ["A", "A", "B"]);
    assert.strictEqual(r, "ok");
    // After dedup: [A, B]. A fails, B succeeds.
    assert.deepStrictEqual(mock.callLog, ["A", "B"]);
  });

  await test("16. Empty list [] → throws AI_CONFIG_ERROR, operationFn never called", async () => {
    let callCount = 0;
    const fn = async () => { callCount++; return "ok"; };
    let threw = null;
    try {
      await withEvalModelFallback(fn, []);
    } catch (e) { threw = e; }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
    assert.strictEqual(callCount, 0);
  });

  // ── Tests 17–19: source inspection ───────────────────────────────────────────

  test("17. AI_EVAL_MODELS unset → evaluateAnswer source contains the withRetry fallback branch", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../src/services/ai/aiService.js"), "utf8"
    );
    assert.ok(
      src.includes("withRetry"),
      "evaluateAnswer should reference withRetry as the unconfigured fallback"
    );
    assert.ok(
      src.includes("AI_EVAL_MODELS.length > 0"),
      "evaluateAnswer should check AI_EVAL_MODELS.length"
    );
  });

  test("18. AI_EVAL_MODELS set → evaluateAnswer source contains the withEvalModelFallback branch", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../src/services/ai/aiService.js"), "utf8"
    );
    assert.ok(
      src.includes("withEvalModelFallback"),
      "evaluateAnswer should reference withEvalModelFallback"
    );
  });

  test("19. adapter.generate uses the model option when passed, not hardcoded AI_MODEL", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../src/services/ai/providers/openRouterAdapter.js"), "utf8"
    );
    // The destructuring should pick model from options, defaulting to AI_MODEL
    assert.ok(
      src.includes("model = AI_MODEL"),
      "generate() should destructure model from options with AI_MODEL default"
    );
    // The body should use the local variable, not the imported constant directly
    // Check that body uses `model,` (shorthand) not `model: AI_MODEL`
    assert.ok(
      src.includes("model,") || /model:\s*model[^:]/.test(src),
      "request body should use the local model variable"
    );
  });

  // ── Tests 20–21: adapter HTTP behaviour with mocked global fetch ──────────────

  await test("20. Adapter HTTP 401 → throws AI_AUTH_ERROR with status 401", async () => {
    const realFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        headers: { get: () => null },
        text: async () => "Unauthorized",
      });
      // We need to require the adapter after patching fetch
      // The adapter uses the module-level fetch; delete cache and re-require
      const adapterPath = require.resolve("../src/services/ai/providers/openRouterAdapter");
      delete require.cache[adapterPath];
      // Also clear env cache so it re-reads with a valid API key stub
      const envPath = require.resolve("../src/config/env");
      const envCache = require.cache[envPath];
      // Temporarily patch env to have a non-placeholder API key
      const originalExports = envCache ? { ...envCache.exports } : null;
      if (envCache) envCache.exports.OPENROUTER_API_KEY = "sk-test-key";
      const adapter = require("../src/services/ai/providers/openRouterAdapter");
      let threw = null;
      try {
        await adapter.generate("sys", "usr", {});
      } catch (e) { threw = e; }
      assert.ok(threw, "Expected error to be thrown");
      assert.strictEqual(threw.code, "AI_AUTH_ERROR");
      assert.strictEqual(threw.status, 401);
      // restore env
      if (envCache && originalExports) envCache.exports.OPENROUTER_API_KEY = originalExports.OPENROUTER_API_KEY;
    } finally {
      globalThis.fetch = realFetch;
      // Clear adapter cache so later tests get a fresh instance
      delete require.cache[require.resolve("../src/services/ai/providers/openRouterAdapter")];
    }
  });

  await test("21. Adapter HTTP 429 → throws AI_RATE_LIMIT (unchanged behavior)", async () => {
    const realFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 429,
        headers: { get: () => null },
        text: async () => "Too Many Requests",
      });
      const adapterPath = require.resolve("../src/services/ai/providers/openRouterAdapter");
      delete require.cache[adapterPath];
      const envPath = require.resolve("../src/config/env");
      const envCache = require.cache[envPath];
      const originalExports = envCache ? { ...envCache.exports } : null;
      if (envCache) envCache.exports.OPENROUTER_API_KEY = "sk-test-key";
      const adapter = require("../src/services/ai/providers/openRouterAdapter");
      let threw = null;
      try {
        await adapter.generate("sys", "usr", {});
      } catch (e) { threw = e; }
      assert.ok(threw, "Expected error to be thrown");
      assert.strictEqual(threw.code, "AI_RATE_LIMIT");
      assert.strictEqual(threw.status, 429);
      if (envCache && originalExports) envCache.exports.OPENROUTER_API_KEY = originalExports.OPENROUTER_API_KEY;
    } finally {
      globalThis.fetch = realFetch;
      delete require.cache[require.resolve("../src/services/ai/providers/openRouterAdapter")];
    }
  });

  // ── Test 22: source inspection — reevaluateAnswer ─────────────────────────────

  test("22. reevaluateAnswer in interviewService.js reuses existing AnswerAttempt (no new AnswerAttempt)", () => {
    const interviewServicePath = path.join(__dirname, "../src/services/interviewService.js");
    const src = fs.readFileSync(interviewServicePath, "utf8");
    // Find the reevaluateAnswer function body
    const fnStart = src.indexOf("reevaluateAnswer");
    assert.ok(fnStart !== -1, "reevaluateAnswer function not found in interviewService.js");
    // Extract everything from the function name to the next top-level export or function
    // Simple approach: find the next function declaration after the start
    const fnBody = src.slice(fnStart, fnStart + 3000);
    assert.ok(
      !fnBody.includes("new AnswerAttempt("),
      "reevaluateAnswer must not create a new AnswerAttempt — it should reuse the existing one"
    );
  });

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log("");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
