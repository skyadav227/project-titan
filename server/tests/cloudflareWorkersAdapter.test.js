/**
 * cloudflareWorkersAdapter.test.js
 *
 * Deterministic mocked tests for the Cloudflare Workers AI adapter.
 * 28 tests: HTTP behaviour, guards, error codes, source inspections, regression.
 *
 * Plain-Node deterministic pattern — no test framework, no DB connection.
 * Run: node tests/cloudflareWorkersAdapter.test.js  (from server/)
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const ADAPTER_PATH = path.join(__dirname, "../src/services/ai/providers/cloudflareWorkersAdapter.js");
const ENV_PATH     = path.join(__dirname, "../src/config/env.js");
const AI_SVC_PATH  = path.join(__dirname, "../src/services/ai/aiService.js");

function loadAdapterWithEnv(envOverrides) {
  // Clear adapter cache
  delete require.cache[require.resolve(ADAPTER_PATH)];
  // Patch env exports
  const envCacheEntry = require.cache[require.resolve(ENV_PATH)];
  const original = envCacheEntry ? { ...envCacheEntry.exports } : null;
  if (envCacheEntry) {
    Object.assign(envCacheEntry.exports, envOverrides);
  }
  const adapter = require(ADAPTER_PATH);
  return { adapter, original, envCacheEntry };
}

function restoreEnv(envCacheEntry, original) {
  if (envCacheEntry && original) {
    // Replace all keys with original values
    for (const k of Object.keys(envCacheEntry.exports)) {
      delete envCacheEntry.exports[k];
    }
    Object.assign(envCacheEntry.exports, original);
  }
  delete require.cache[require.resolve(ADAPTER_PATH)];
}

const TEST_ENV = {
  CF_AI_GATEWAY_ENABLED: true,
  CF_ACCOUNT_ID:    "test-account-id",
  CF_API_TOKEN:     "test-api-token",
  CF_AI_GATEWAY_ID: "titan-observability-dev",
  AI_MODEL:         "@cf/meta/llama-3.1-8b-instruct",
  AI_TIMEOUT_MS:    5000,
  IS_PRODUCTION:    false,
};

function makeOkFetch(content = "hello world") {
  return async (url, opts) => ({
    ok:      true,
    status:  200,
    headers: { get: () => null },
    json:    async () => ({
      choices: [{ message: { content }, finish_reason: "stop" }],
      usage:   { completion_tokens: 10 },
    }),
  });
}

function makeErrFetch(status) {
  return async () => ({
    ok:      false,
    status,
    headers: { get: () => null },
    text:    async () => "error body",
    json:    async () => ({}),
  });
}

// Ensure env.js is loaded before we start patching it
require(ENV_PATH);
// Ensure adapter is not cached from a previous run
delete require.cache[require.resolve(ADAPTER_PATH)];

async function runTests() {
  // ── Test 1: Correct endpoint ──────────────────────────────────────────────
  await test("1. Correct endpoint — fetch called with Cloudflare API URL", async () => {
    let capturedUrl;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedUrl = url; return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, NODE_ENV_OVERRIDE: undefined });
    // Also need process.env.NODE_ENV set
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr");
      assert.ok(capturedUrl, "fetch was not called");
      assert.ok(
        capturedUrl.startsWith("https://api.cloudflare.com/client/v4/accounts/test-account-id/ai/v1/chat/completions"),
        `Unexpected URL: ${capturedUrl}`
      );
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 2: HTTP method ───────────────────────────────────────────────────
  await test("2. HTTP method — fetch called with POST", async () => {
    let capturedMethod;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedMethod = opts.method; return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr");
      assert.strictEqual(capturedMethod, "POST");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 3: Authorization header ─────────────────────────────────────────
  await test("3. Authorization header — Bearer test-api-token", async () => {
    let capturedAuth;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedAuth = opts.headers["Authorization"]; return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr");
      assert.strictEqual(capturedAuth, "Bearer test-api-token");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 4: Gateway ID header ─────────────────────────────────────────────
  await test("4. Gateway ID header — cf-aig-gateway-id: titan-observability-dev", async () => {
    let capturedGwId;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedGwId = opts.headers["cf-aig-gateway-id"]; return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr");
      assert.strictEqual(capturedGwId, "titan-observability-dev");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 5: Payload suppression header ───────────────────────────────────
  await test("5. Payload suppression header — cf-aig-collect-log-payload: \"false\"", async () => {
    let capturedSuppressHeader;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedSuppressHeader = opts.headers["cf-aig-collect-log-payload"]; return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr");
      assert.strictEqual(capturedSuppressHeader, "false");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 6: Request body structure ───────────────────────────────────────
  await test("6. Request body structure — messages, max_completion_tokens, temperature, model", async () => {
    let capturedBody;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => { capturedBody = JSON.parse(opts.body); return makeOkFetch()(url, opts); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate("sys", "usr", { maxTokens: 2048, temperature: 0.5 });
      assert.ok(Array.isArray(capturedBody.messages), "messages must be an array");
      assert.strictEqual(capturedBody.messages[0].role, "system");
      assert.strictEqual(capturedBody.messages[1].role, "user");
      assert.strictEqual(capturedBody.max_completion_tokens, 2048, "must use max_completion_tokens, not max_tokens");
      assert.ok(!("max_tokens" in capturedBody), "must NOT use max_tokens");
      assert.strictEqual(capturedBody.temperature, 0.5);
      assert.strictEqual(capturedBody.model, "@cf/meta/llama-3.1-8b-instruct");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 7: Missing CF_API_TOKEN ─────────────────────────────────────────
  await test("7. Missing CF_API_TOKEN → throws AI_CONFIG_ERROR, fetch not called", async () => {
    let fetchCalled = false;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { fetchCalled = true; return makeOkFetch()(); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, CF_API_TOKEN: "" });
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
    assert.strictEqual(fetchCalled, false, "fetch must not be called");
  });

  // ── Test 8: Missing CF_ACCOUNT_ID ────────────────────────────────────────
  await test("8. Missing CF_ACCOUNT_ID → throws AI_CONFIG_ERROR, fetch not called", async () => {
    let fetchCalled = false;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { fetchCalled = true; return makeOkFetch()(); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, CF_ACCOUNT_ID: "" });
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
    assert.strictEqual(fetchCalled, false, "fetch must not be called");
  });

  // ── Test 9: Gateway disabled ──────────────────────────────────────────────
  await test("9. Gateway disabled (CF_AI_GATEWAY_ENABLED=false) → throws AI_CONFIG_ERROR", async () => {
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, CF_AI_GATEWAY_ENABLED: false });
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
  });

  // ── Test 10: Production guard ─────────────────────────────────────────────
  await test("10. Production guard — IS_PRODUCTION=true → throws AI_CONFIG_ERROR", async () => {
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, IS_PRODUCTION: true });
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
    assert.ok(threw.message.includes("production"), "Error message should mention production");
  });

  // ── Test 11: Unset NODE_ENV guard ─────────────────────────────────────────
  await test("11. Unset NODE_ENV guard — NODE_ENV unset → throws AI_CONFIG_ERROR", async () => {
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, IS_PRODUCTION: false });
    const origNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR");
  });

  // ── Test 12: HTTP 401 → AI_AUTH_ERROR ────────────────────────────────────
  await test("12. HTTP 401 → AI_AUTH_ERROR", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeErrFetch(401);
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_AUTH_ERROR");
    assert.strictEqual(threw.status, 401);
  });

  // ── Test 13: HTTP 429 → AI_RATE_LIMIT ────────────────────────────────────
  await test("13. HTTP 429 → AI_RATE_LIMIT", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeErrFetch(429);
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_RATE_LIMIT");
    assert.strictEqual(threw.status, 429);
  });

  // ── Test 14: HTTP 500 → AI_PROVIDER_ERROR ────────────────────────────────
  await test("14. HTTP 500 → AI_PROVIDER_ERROR", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeErrFetch(500);
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_PROVIDER_ERROR");
    assert.strictEqual(threw.status, 500);
  });

  // ── Test 15: Network failure ──────────────────────────────────────────────
  await test("15. Network failure (fetch throws) → AI_NETWORK_ERROR", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error("ECONNREFUSED"); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_NETWORK_ERROR");
  });

  // ── Test 16: Empty content → AI_EMPTY_RESPONSE ───────────────────────────
  await test("16. Empty content → AI_EMPTY_RESPONSE", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true, status: 200,
      headers: { get: () => null },
      json: async () => ({ choices: [{ message: { content: "   " }, finish_reason: "stop" }], usage: {} }),
    });
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_EMPTY_RESPONSE");
  });

  // ── Test 17: Timeout (AbortError) → AI_NETWORK_ERROR ─────────────────────
  await test("17. Timeout (AbortError) → AI_NETWORK_ERROR", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_NETWORK_ERROR");
    assert.ok(threw.message.includes("timed out"), "Error message should mention timeout");
  });

  // ── Test 18: No credentials in error messages (source inspection) ─────────
  test("18. No credentials in error messages — source inspection", () => {
    const src = fs.readFileSync(ADAPTER_PATH, "utf8");
    // Find all string literals used as error messages — look for template literals in new Error()
    // Specifically check that ${CF_API_TOKEN} and ${CF_ACCOUNT_ID} don't appear inside error message strings
    assert.ok(
      !src.includes("`${CF_API_TOKEN}"),
      "CF_API_TOKEN must not be interpolated into error messages"
    );
    assert.ok(
      !src.includes("`${CF_ACCOUNT_ID}"),
      "CF_ACCOUNT_ID must not be interpolated into error messages"
    );
    // Extra check: err.message assignments should not contain token values
    const errMsgLines = src.split("\n").filter(l => l.includes("new Error("));
    for (const line of errMsgLines) {
      assert.ok(!line.includes("CF_API_TOKEN"), `Error message line must not reference CF_API_TOKEN: ${line.trim()}`);
      assert.ok(!line.includes("CF_ACCOUNT_ID"), `Error message line must not reference CF_ACCOUNT_ID: ${line.trim()}`);
    }
  });

  // ── Test 19: No sensitive content in logs (source inspection) ────────────
  test("19. No sensitive content in logs — source inspection", () => {
    const src = fs.readFileSync(ADAPTER_PATH, "utf8");
    // Check that console.* calls do not reference systemPrompt, userPrompt, or content
    const consoleLines = src.split("\n").filter(l => /console\.(log|info|warn|error)/.test(l));
    for (const line of consoleLines) {
      assert.ok(!line.includes("systemPrompt"), `console call must not log systemPrompt: ${line.trim()}`);
      assert.ok(!line.includes("userPrompt"),   `console call must not log userPrompt: ${line.trim()}`);
      // 'content' is tricky — ensure we're not logging the response content variable
      // We check for the specific variable `content` being passed directly to console
      assert.ok(
        !/console\..*content[^T]/.test(line) || line.includes("contentType") || line.includes("content:"),
        `console call must not log response content: ${line.trim()}`
      );
    }
  });

  // ── Test 20: cf-aig-collect-log-payload hardcoded (source inspection) ─────
  test("20. cf-aig-collect-log-payload hardcoded as literal string \"false\"", () => {
    const src = fs.readFileSync(ADAPTER_PATH, "utf8");
    // The value must be a literal string "false", not a variable reference
    assert.ok(
      src.includes('"cf-aig-collect-log-payload": "false"'),
      'cf-aig-collect-log-payload must be hardcoded as literal string "false"'
    );
    // Must not reference an env variable for this value
    const lines = src.split("\n");
    const headerLine = lines.find(l => l.includes("cf-aig-collect-log-payload"));
    assert.ok(headerLine, "cf-aig-collect-log-payload header line not found");
    assert.ok(
      !headerLine.includes("process.env"),
      "cf-aig-collect-log-payload must not reference process.env"
    );
    assert.ok(
      !headerLine.includes("CF_"),
      "cf-aig-collect-log-payload must not reference a CF_ env variable"
    );
  });

  // ── Test 21: Successful response returns content string ──────────────────
  await test("21. Successful response — returns content string from choices[0].message.content", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeOkFetch("This is the response content.");
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let result;
    try {
      result = await adapter.generate("sys", "usr");
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.strictEqual(result, "This is the response content.");
  });

  // ── Test 22: Provider selection (source inspection) ──────────────────────
  test("22. Provider selection — AI_PROVIDER=cloudflare_workers → getAdapter loads cloudflareWorkersAdapter", () => {
    const src = fs.readFileSync(AI_SVC_PATH, "utf8");
    assert.ok(
      src.includes('AI_PROVIDER === "cloudflare_workers"'),
      'aiService.js must check AI_PROVIDER === "cloudflare_workers"'
    );
    assert.ok(
      src.includes("cloudflareWorkersAdapter"),
      "aiService.js must reference cloudflareWorkersAdapter"
    );
  });

  // ── Test 23: OpenRouter unchanged (source inspection) ────────────────────
  test("23. OpenRouter unchanged — AI_PROVIDER=openrouter does not load cloudflareWorkersAdapter", () => {
    const src = fs.readFileSync(AI_SVC_PATH, "utf8");
    // The openrouter branch must still be present
    assert.ok(
      src.includes('AI_PROVIDER === "openrouter"'),
      'aiService.js must still check AI_PROVIDER === "openrouter"'
    );
    assert.ok(
      src.includes("openRouterAdapter"),
      "aiService.js must still reference openRouterAdapter"
    );
    // The cloudflare branch must be guarded with its own condition, not mixed into openrouter
    const orIdx  = src.indexOf('AI_PROVIDER === "openrouter"');
    const cfIdx  = src.indexOf('AI_PROVIDER === "cloudflare_workers"');
    assert.ok(orIdx !== -1 && cfIdx !== -1, "Both provider conditions must exist");
    // They must be separate if-statements (not in the same line)
    const lineOf = (idx) => src.slice(0, idx).split("\n").length;
    assert.notStrictEqual(lineOf(orIdx), lineOf(cfIdx), "openrouter and cloudflare_workers checks must be on different lines");
  });

  // ── Test 24: Existing OpenRouter regression ───────────────────────────────
  await test("24. Existing OpenRouter behavior — eval_model_fallback.test.js still passes", async () => {
    // Run the existing test file as a child process and check exit code
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const execFileAsync = promisify(execFile);
    const serverDir = path.join(__dirname, "..");
    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [path.join(__dirname, "eval_model_fallback.test.js")],
        { cwd: serverDir, timeout: 30000 }
      );
      // If it exits 0, the test passed
      console.log("  [regression] eval_model_fallback output (last line):",
        stdout.trim().split("\n").slice(-2).join(" | "));
    } catch (err) {
      throw new Error(`eval_model_fallback.test.js failed: ${err.message}\n${err.stdout || ""}\n${err.stderr || ""}`);
    }
  });

  // ── Test 25: Behavioral logging privacy ──────────────────────────────────
  await test("25. Behavioral logging privacy — sensitive prompt markers do not appear in logs", async () => {
    const SENSITIVE_SYS = "SENSITIVE_SYS_12345";
    const SENSITIVE_USR = "SENSITIVE_USR_67890";
    const capturedLogs = [];
    const realLog   = console.log;
    const realInfo  = console.info;
    const realWarn  = console.warn;
    const realError = console.error;
    const capture = (...args) => capturedLogs.push(args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    console.log   = capture;
    console.info  = capture;
    console.warn  = capture;
    console.error = capture;
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeOkFetch("safe response content");
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      await adapter.generate(SENSITIVE_SYS, SENSITIVE_USR);
      for (const line of capturedLogs) {
        assert.ok(!line.includes(SENSITIVE_SYS), `Sensitive sys marker appeared in log: ${line}`);
        assert.ok(!line.includes(SENSITIVE_USR), `Sensitive usr marker appeared in log: ${line}`);
      }
    } finally {
      console.log   = realLog;
      console.info  = realInfo;
      console.warn  = realWarn;
      console.error = realError;
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
  });

  // ── Test 26: Malformed JSON response → AI_EMPTY_RESPONSE ─────────────────
  await test("26. Malformed JSON response → AI_EMPTY_RESPONSE", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok:      true,
      status:  200,
      headers: { get: () => null },
      json:    async () => { throw new SyntaxError("Unexpected token < in JSON"); },
    });
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_EMPTY_RESPONSE", `Expected AI_EMPTY_RESPONSE, got ${threw.code}`);
  });

  // ── Test 27: Empty CF_AI_GATEWAY_ID → AI_CONFIG_ERROR, fetch not called ──
  await test("27. Empty CF_AI_GATEWAY_ID → AI_CONFIG_ERROR, fetch not called", async () => {
    let fetchCalled = false;
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => { fetchCalled = true; return makeOkFetch()(); };
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv({ ...TEST_ENV, CF_AI_GATEWAY_ID: "" });
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_CONFIG_ERROR", `Expected AI_CONFIG_ERROR, got ${threw.code}`);
    assert.strictEqual(fetchCalled, false, "fetch must not be called when gateway ID is missing");
  });

  // ── Test 28: Empty choices array → AI_EMPTY_RESPONSE ─────────────────────
  await test("28. Empty choices array → AI_EMPTY_RESPONSE", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok:      true,
      status:  200,
      headers: { get: () => null },
      json:    async () => ({ choices: [], usage: {} }),
    });
    const { adapter, original, envCacheEntry } = loadAdapterWithEnv(TEST_ENV);
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    let threw = null;
    try {
      await adapter.generate("sys", "usr");
    } catch (e) { threw = e; } finally {
      process.env.NODE_ENV = origNodeEnv;
      globalThis.fetch = realFetch;
      restoreEnv(envCacheEntry, original);
    }
    assert.ok(threw, "Expected error to be thrown");
    assert.strictEqual(threw.code, "AI_EMPTY_RESPONSE", `Expected AI_EMPTY_RESPONSE, got ${threw.code}`);
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
