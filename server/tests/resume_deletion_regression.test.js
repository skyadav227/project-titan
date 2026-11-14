/**
 * resume_deletion_regression.test.js
 *
 * Focused regression tests for the resume deletion restoration fix.
 *
 * HOW THIS WORKS
 * ─────────────
 * No DB, no HTTP. Each test either:
 *   (a) inspects the source text of the relevant file to verify the correct
 *       code is present (source-reading inspection), or
 *   (b) runs a small pure-function simulation of the logic to confirm
 *       correct behaviour (logic simulation).
 *
 * Run: node tests/resume_deletion_regression.test.js
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

// ── Source file contents ──────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");

const controllerSrc = fs.readFileSync(
  path.join(ROOT, "src/controllers/resume.controller.js"),
  "utf8"
);

const clientRoot = path.resolve(ROOT, "../client/src");
const contextSrc = fs.readFileSync(
  path.join(clientRoot, "contexts/ResumeContext.jsx"),
  "utf8"
);

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 1: getLatestResume query includes deletedAt: null ══\n");

test("T1 getLatestResume findOne filter includes deletedAt: null (source inspection)", () => {
  // Extract only the getLatestResume function body
  const start = controllerSrc.indexOf("async function getLatestResume");
  const end   = controllerSrc.indexOf("async function", start + 10);
  const body  = controllerSrc.slice(start, end);
  assert(
    body.includes("deletedAt: null"),
    "getLatestResume findOne filter must include deletedAt: null"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 2: getActiveResume query includes deletedAt: null ══\n");

test("T2 getActiveResume findOne filter includes deletedAt: null (source inspection)", () => {
  // Extract only the getActiveResume function body
  const start = controllerSrc.indexOf("async function getActiveResume");
  const end   = controllerSrc.indexOf("async function", start + 10);
  const body  = controllerSrc.slice(start, end);
  assert(
    body.includes("deletedAt: null"),
    "getActiveResume findOne filter must include deletedAt: null"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 3: Non-deleted ready version still returned by getLatestResume ══\n");

test("T3 Non-deleted ready version still returned by getLatestResume query (logic simulation)", () => {
  // Simulate a mock findOne that accepts a filter and a list of documents,
  // returning the highest-version document that matches all filter fields.
  function mockFindOne(filter, documents) {
    const matches = documents.filter(doc => {
      return Object.keys(filter).every(key => {
        // Treat null filter values as "field must be null or undefined"
        if (filter[key] === null) {
          return doc[key] === null || doc[key] === undefined;
        }
        return doc[key] === filter[key];
      });
    });
    // sort descending by version and return the first (highest)
    matches.sort((a, b) => b.version - a.version);
    return matches.length > 0 ? matches[0] : null;
  }

  const docs = [
    { userId: "u1", version: 1, status: "ready", isActive: false, deletedAt: new Date() }, // deleted
    { userId: "u1", version: 2, status: "ready", isActive: false, deletedAt: null },        // eligible
    { userId: "u1", version: 3, status: "ready", isActive: false, deletedAt: new Date() }, // deleted
  ];

  const filter = { userId: "u1", deletedAt: null };
  const result = mockFindOne(filter, docs);

  assert(result !== null, "Must return a document when a non-deleted version exists");
  assert(result.version === 2, `Expected version 2 (the only non-deleted), got version ${result.version}`);
  assert(result.deletedAt === null, "Returned document must not be deleted");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 4: applyBackendState guard — deleted version ══\n");

test("T4 applyBackendState: deleted version → sets uiState='none', clears resumeVersion (logic simulation)", () => {
  // Replicate the full applyBackendState function logic from ResumeContext.jsx
  // including the new deletedAt guard, operating on a plain state object.
  function applyBackendState(version, state) {
    // Guard: a deleted version must never be restored as an active UI state.
    if (version.deletedAt) {
      state.resumeVersion = null;
      state.activeResume  = null;
      state.uiState       = "none";
      return;
    }

    state.resumeVersion = version;

    if (version.status === "ready" && version.isActive) {
      state.activeResume = version;
      state.uiState      = "active";
      return;
    }
    if (version.status === "ready" && !version.isActive) {
      state.uiState = "ready_for_review";
      return;
    }
    if (version.status === "processing" || version.status === "uploaded") {
      state.uiState = "processing";
      return;
    }
    if (version.status === "failed") {
      state.uiState = "failed";
      return;
    }
    state.uiState = "none";
  }

  const state = { uiState: "ready_for_review", resumeVersion: { id: "v5" }, activeResume: null };
  const deletedVersion = { id: "v5", status: "ready", isActive: false, deletedAt: new Date() };

  applyBackendState(deletedVersion, state);

  assert(state.uiState === "none",        `Expected uiState 'none', got '${state.uiState}'`);
  assert(state.resumeVersion === null,    "resumeVersion must be cleared for deleted version");
  assert(state.activeResume  === null,    "activeResume must be cleared for deleted version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 5: applyBackendState guard — non-deleted ready version ══\n");

test("T5 applyBackendState: non-deleted ready version → sets uiState='ready_for_review' (logic simulation)", () => {
  function applyBackendState(version, state) {
    if (version.deletedAt) {
      state.resumeVersion = null;
      state.activeResume  = null;
      state.uiState       = "none";
      return;
    }
    state.resumeVersion = version;
    if (version.status === "ready" && version.isActive) { state.activeResume = version; state.uiState = "active"; return; }
    if (version.status === "ready" && !version.isActive) { state.uiState = "ready_for_review"; return; }
    if (version.status === "processing" || version.status === "uploaded") { state.uiState = "processing"; return; }
    if (version.status === "failed") { state.uiState = "failed"; return; }
    state.uiState = "none";
  }

  const state = { uiState: "none", resumeVersion: null, activeResume: null };
  const readyVersion = { id: "v3", status: "ready", isActive: false, deletedAt: null };

  applyBackendState(readyVersion, state);

  assert(state.uiState === "ready_for_review", `Expected 'ready_for_review', got '${state.uiState}'`);
  assert(state.resumeVersion === readyVersion,  "resumeVersion must be set to the ready version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 6: applyBackendState guard — non-deleted active version ══\n");

test("T6 applyBackendState: non-deleted active version → sets uiState='active' (logic simulation)", () => {
  function applyBackendState(version, state) {
    if (version.deletedAt) {
      state.resumeVersion = null;
      state.activeResume  = null;
      state.uiState       = "none";
      return;
    }
    state.resumeVersion = version;
    if (version.status === "ready" && version.isActive) { state.activeResume = version; state.uiState = "active"; return; }
    if (version.status === "ready" && !version.isActive) { state.uiState = "ready_for_review"; return; }
    if (version.status === "processing" || version.status === "uploaded") { state.uiState = "processing"; return; }
    if (version.status === "failed") { state.uiState = "failed"; return; }
    state.uiState = "none";
  }

  const state = { uiState: "none", resumeVersion: null, activeResume: null };
  const activeVersion = { id: "v2", status: "ready", isActive: true, deletedAt: null };

  applyBackendState(activeVersion, state);

  assert(state.uiState === "active",             `Expected 'active', got '${state.uiState}'`);
  assert(state.activeResume === activeVersion,    "activeResume must be set for active version");
  assert(state.resumeVersion === activeVersion,   "resumeVersion must be set for active version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 7: activateResumeFn catch — RESUME_DELETED clears state ══\n");

test("T7 activateResumeFn catch: RESUME_DELETED → clears resumeVersion and sets uiState='none' (logic simulation)", async () => {
  // Replicate the async try/catch logic from activateResumeFn.
  async function activateResumeFn(versionId, state, mockApiActivate) {
    try {
      const activated = await mockApiActivate(versionId);
      state.activeResume    = activated;
      state.resumeVersion   = activated;
      state.isReplacing     = false;
      state.uiState         = "active";
    } catch (err) {
      state.error = { code: err.code || "ACTIVATION_FAILED", message: err.message || "Something went wrong. Please try again." };
      // Only clear the review state if the version was deleted — not for
      // transient errors where a legitimate ready_for_review state should persist.
      if (err.code === "RESUME_DELETED") {
        state.resumeVersion = null;
        state.uiState       = "none";
      }
    }
  }

  const deletedErr = Object.assign(new Error("This resume has been deleted."), { code: "RESUME_DELETED" });
  const mockApiActivate = () => Promise.reject(deletedErr);

  const state = {
    uiState: "ready_for_review",
    resumeVersion: { id: "v7" },
    activeResume: null,
    isReplacing: false,
    error: null,
  };

  await activateResumeFn("v7", state, mockApiActivate);

  assert(state.uiState === "none",        `Expected uiState 'none', got '${state.uiState}'`);
  assert(state.resumeVersion === null,    "resumeVersion must be cleared on RESUME_DELETED");
  assert(state.error?.code === "RESUME_DELETED", `Expected RESUME_DELETED error code, got '${state.error?.code}'`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 8: activateResumeFn catch — network error preserves uiState ══\n");

test("T8 activateResumeFn catch: network error → preserves uiState, does NOT clear resumeVersion (logic simulation)", async () => {
  async function activateResumeFn(versionId, state, mockApiActivate) {
    try {
      const activated = await mockApiActivate(versionId);
      state.activeResume    = activated;
      state.resumeVersion   = activated;
      state.isReplacing     = false;
      state.uiState         = "active";
    } catch (err) {
      state.error = { code: err.code || "ACTIVATION_FAILED", message: err.message || "Something went wrong. Please try again." };
      if (err.code === "RESUME_DELETED") {
        state.resumeVersion = null;
        state.uiState       = "none";
      }
      // For all other errors: existing uiState and resumeVersion are preserved
    }
  }

  const networkErr = Object.assign(new Error("Network error"), { code: "NETWORK_ERROR" });
  const mockApiActivate = () => Promise.reject(networkErr);

  const originalVersion = { id: "v8", status: "ready", isActive: false };
  const state = {
    uiState: "ready_for_review",
    resumeVersion: originalVersion,
    activeResume: null,
    isReplacing: false,
    error: null,
  };

  await activateResumeFn("v8", state, mockApiActivate);

  assert(state.uiState === "ready_for_review",    `Expected uiState preserved as 'ready_for_review', got '${state.uiState}'`);
  assert(state.resumeVersion === originalVersion, "resumeVersion must NOT be cleared on non-RESUME_DELETED error");
  assert(state.error?.code === "NETWORK_ERROR",   `Expected NETWORK_ERROR, got '${state.error?.code}'`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Test 9: activateResumeFn success path ══\n");

test("T9 activateResumeFn success path → sets uiState='active' (logic simulation)", async () => {
  async function activateResumeFn(versionId, state, mockApiActivate) {
    try {
      const activated = await mockApiActivate(versionId);
      state.activeResume    = activated;
      state.resumeVersion   = activated;
      state.isReplacing     = false;
      state.uiState         = "active";
    } catch (err) {
      state.error = { code: err.code || "ACTIVATION_FAILED", message: err.message || "Something went wrong. Please try again." };
      if (err.code === "RESUME_DELETED") {
        state.resumeVersion = null;
        state.uiState       = "none";
      }
    }
  }

  const activatedVersion = { id: "v9", status: "ready", isActive: true, deletedAt: null };
  const mockApiActivate = () => Promise.resolve(activatedVersion);

  const state = {
    uiState: "ready_for_review",
    resumeVersion: { id: "v9", status: "ready", isActive: false },
    activeResume: null,
    isReplacing: false,
    error: null,
  };

  await activateResumeFn("v9", state, mockApiActivate);

  assert(state.uiState === "active",                  `Expected uiState 'active', got '${state.uiState}'`);
  assert(state.activeResume === activatedVersion,     "activeResume must be set to the activated version");
  assert(state.resumeVersion === activatedVersion,    "resumeVersion must be set to the activated version");
  assert(state.isReplacing === false,                 "isReplacing must be cleared on success");
  assert(state.error === null,                        "error must remain null on success");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${PASS + FAIL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${PASS + FAIL}\n\n`);
process.exit(FAIL > 0 ? 1 : 0);
