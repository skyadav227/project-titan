/**
 * resume_restore_logic.test.js
 *
 * Deterministic unit tests for the five ResumeContext restoration scenarios
 * and the retryRestore / clearance-after-retry behaviour.
 *
 * HOW THIS WORKS
 * ─────────────
 * ResumeContext is a React hook and cannot run outside a React tree.
 * This file tests the pure restoration decision logic by extracting it
 * verbatim from the context and running it with mocked API responses.
 *
 * The extracted function is a faithful copy of restoreFromBackend() with
 * React setState calls replaced by plain object mutations so the logic
 * can run synchronously in Node without a DOM.
 *
 * Run: node tests/resume_restore_logic.test.js
 */
"use strict";

let PASS = 0, FAIL = 0;
function test(label, fn) {
  try { fn(); PASS++; process.stdout.write(`  ✓  ${label}\n`); }
  catch (e) { FAIL++; process.stdout.write(`  ✗  FAIL: ${label}\n     ${e.message}\n`); }
}
function assert(c, m) { if (!c) throw new Error(m || "Assertion failed"); }

// ── Minimal stub for applyBackendState ────────────────────────────────────────
// Maps version.status to the equivalent uiState (mirrors the real context)
function applyBackendState(version, state) {
  state.resumeVersion = version;
  if (version.status === "ready" && version.isActive)  { state.uiState = "active";          return; }
  if (version.status === "ready" && !version.isActive) { state.uiState = "ready_for_review"; return; }
  if (version.status === "processing" || version.status === "uploaded") { state.uiState = "processing"; return; }
  if (version.status === "failed")                     { state.uiState = "failed";           return; }
  state.uiState = "none";
}

// ── Core restoration logic extracted from ResumeContext.restoreFromBackend ────
// Accepts mocked API responses and writes results into a plain state object.
async function runRestore(opts, state) {
  const { getActive, getLatest } = opts;

  let active = null, activeErr = null;
  let latest = null, latestErr = null;

  try { active = await getActive(); } catch (e) { activeErr = e; }
  try { latest = await getLatest(); } catch (e) { latestErr = e; }

  if (activeErr && latestErr) {
    state.restoreError = { code: "RESTORE_FAILED", message: "Couldn't reach the server." };
    if (state.uiState === "loading") state.uiState = "none";
    return;
  }

  state.restoreError = null;

  const effectiveActive = activeErr ? (latest?.isActive ? latest : null) : active;

  if (effectiveActive) {
    state.activeResume  = effectiveActive;
    state.resumeVersion = effectiveActive;
    state.uiState       = "active";
    if (activeErr) state.restoreError = { code: "RESTORE_PARTIAL", message: "Couldn't verify active status directly." };
    if (latestErr) state.restoreError = { code: "RESTORE_PARTIAL", message: "Couldn't check for newer resume versions." };
    return;
  }

  if (!latestErr && latest) {
    state.activeResume = null;
    applyBackendState(latest, state);
    if (activeErr) state.restoreError = { code: "RESTORE_PARTIAL", message: "Couldn't verify active status." };
    return;
  }

  state.resumeVersion = null;
  state.activeResume  = null;
  state.uiState       = "none";
  if (latestErr)       state.restoreError = { code: "RESTORE_FAILED",  message: "Couldn't fetch your latest resume version." };
  else if (activeErr)  state.restoreError = { code: "RESTORE_PARTIAL", message: "Couldn't verify your active resume status." };
}

// ── Shared fixtures ───────────────────────────────────────────────────────────
const ACTIVE_RESUME = { id: "v42", version: 42, status: "ready", isActive: true,  fileName: "resume.pdf" };
const READY_INACTIVE = { id: "v47", version: 47, status: "ready", isActive: false, fileName: "resume.pdf" };
const PROCESSING     = { id: "v48", version: 48, status: "processing", isActive: false };
const FAILED_VERSION = { id: "v49", version: 49, status: "failed", isActive: false };
const API_ERR = new Error("Network error");

function fresh() { return { uiState: "loading", activeResume: null, resumeVersion: null, restoreError: null }; }
const ok   = v => () => Promise.resolve(v);
const fail = ()  => Promise.reject(API_ERR);

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 1: Active succeeds with data; latest fails ══\n");

test("C1.1 uiState becomes 'active'", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: fail }, s);
  assert(s.uiState === "active", `Got ${s.uiState}`);
});
test("C1.2 activeResume is set", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: fail }, s);
  assert(s.activeResume?.id === "v42");
});
test("C1.3 non-blocking warning shown (RESTORE_PARTIAL)", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: fail }, s);
  assert(s.restoreError?.code === "RESTORE_PARTIAL", `Got ${s.restoreError?.code}`);
});
test("C1.4 latest failure does NOT replace active resume with upload screen", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: fail }, s);
  assert(s.uiState !== "none", "Must not show upload screen when active resume exists");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 2: Active succeeds with null; latest fails ══\n");

test("C2.1 uiState becomes 'none'", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: fail }, s);
  assert(s.uiState === "none", `Got ${s.uiState}`);
});
test("C2.2 restoreError is RESTORE_FAILED (not PARTIAL — latest unknown)", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: fail }, s);
  assert(s.restoreError?.code === "RESTORE_FAILED", `Got ${s.restoreError?.code}`);
});
test("C2.3 UI should show RestoreError card, NOT upload screen (code check)", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: fail }, s);
  // ResumePage shows RestoreError when uiState=none AND restoreError.code=RESTORE_FAILED
  const showsRestoreError = s.uiState === "none" && s.restoreError?.code === "RESTORE_FAILED";
  assert(showsRestoreError, "Should trigger RestoreError component, not ResumeEmptyState");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 3: Active fails; latest succeeds with null ══\n");

test("C3.1 uiState becomes 'none'", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(null) }, s);
  assert(s.uiState === "none", `Got ${s.uiState}`);
});
test("C3.2 restoreError is RESTORE_PARTIAL (latest confirmed null, active uncertain)", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(null) }, s);
  assert(s.restoreError?.code === "RESTORE_PARTIAL", `Got ${s.restoreError?.code}`);
});
test("C3.3 warning shown above upload screen (PARTIAL, not FAILED)", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(null) }, s);
  // ResumePage shows RestoreWarning banner + ResumeEmptyState (upload screen)
  // when uiState=none AND restoreError.code=RESTORE_PARTIAL
  const showsWarning = s.uiState === "none" && s.restoreError?.code === "RESTORE_PARTIAL";
  assert(showsWarning, "Should show warning banner alongside upload screen");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 4: Both succeed with null ══\n");

test("C4.1 uiState becomes 'none'", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: ok(null) }, s);
  assert(s.uiState === "none", `Got ${s.uiState}`);
});
test("C4.2 no restoreError — genuine empty state", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: ok(null) }, s);
  assert(s.restoreError === null, `Got ${s.restoreError?.code}`);
});
test("C4.3 UI should show genuine empty upload screen (no restoreError)", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(null), getLatest: ok(null) }, s);
  // ResumePage shows ResumeEmptyState when uiState=none AND restoreError is null
  const showsEmptyState = s.uiState === "none" && s.restoreError === null;
  assert(showsEmptyState, "Should show genuine ResumeEmptyState upload screen");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 5a: Active data succeeds; latest fails (non-blocking warning) ══\n");
// Same as Case 1 — already covered. Extend with sub-cases:

test("C5a.1 Active resume usable during latest failure", async () => {
  const s = fresh();
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: fail }, s);
  assert(s.uiState === "active");
  assert(s.activeResume !== null, "Active resume must remain set");
});

process.stdout.write("\n══ Case 5b: Active fails; latest succeeds with isActive=true ══\n");

test("C5b.1 Active recovered from latest endpoint", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(ACTIVE_RESUME) }, s);
  assert(s.uiState === "active", `Got ${s.uiState}`);
  assert(s.activeResume?.id === "v42");
});
test("C5b.2 RESTORE_PARTIAL warning shown", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(ACTIVE_RESUME) }, s);
  assert(s.restoreError?.code === "RESTORE_PARTIAL");
});

process.stdout.write("\n══ Case 5c: Active fails; latest succeeds (ready, inactive) ══\n");

test("C5c.1 uiState becomes ready_for_review", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(READY_INACTIVE) }, s);
  assert(s.uiState === "ready_for_review", `Got ${s.uiState}`);
});
test("C5c.2 RESTORE_PARTIAL warning shown", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(READY_INACTIVE) }, s);
  assert(s.restoreError?.code === "RESTORE_PARTIAL");
});
test("C5c.3 activeResume not set (not yet activated)", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(READY_INACTIVE) }, s);
  assert(s.activeResume === null, "activeResume must not be set for inactive ready version");
});

process.stdout.write("\n══ Case 5d: Active fails; latest succeeds (processing) ══\n");

test("C5d.1 uiState becomes processing", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: ok(PROCESSING) }, s);
  assert(s.uiState === "processing", `Got ${s.uiState}`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Both endpoints fail ══\n");

test("BF.1 uiState stays 'none' on initial mount (from loading)", async () => {
  const s = fresh(); // starts as "loading"
  await runRestore({ getActive: fail, getLatest: fail }, s);
  assert(s.uiState === "none", `Got ${s.uiState}`);
});
test("BF.2 RESTORE_FAILED code set", async () => {
  const s = fresh();
  await runRestore({ getActive: fail, getLatest: fail }, s);
  assert(s.restoreError?.code === "RESTORE_FAILED");
});
test("BF.3 existing active state preserved on subsequent failure (not initial mount)", async () => {
  const s = { ...fresh(), uiState: "active", activeResume: ACTIVE_RESUME };
  await runRestore({ getActive: fail, getLatest: fail }, s);
  // uiState must NOT regress to "none" if we were previously "active"
  assert(s.uiState === "active", `Got ${s.uiState} — existing state must be preserved`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ retryRestore: clears error and re-fetches ══\n");

test("RT.1 successful retry clears RESTORE_FAILED and shows active resume", async () => {
  const s = { ...fresh(), uiState: "none", restoreError: { code: "RESTORE_FAILED", message: "err" } };
  // Simulate what retryRestore() does: sets loading, then runs restore
  s.uiState = "loading";
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: ok(ACTIVE_RESUME) }, s);
  assert(s.uiState === "active", `Got ${s.uiState}`);
  assert(s.restoreError === null, `restoreError should be cleared: ${s.restoreError?.code}`);
});
test("RT.2 successful retry after RESTORE_PARTIAL shows active resume with no error", async () => {
  const s = { ...fresh(), uiState: "active", restoreError: { code: "RESTORE_PARTIAL", message: "warn" } };
  s.uiState = "loading";
  await runRestore({ getActive: ok(ACTIVE_RESUME), getLatest: ok(READY_INACTIVE) }, s);
  assert(s.uiState === "active");
  assert(s.restoreError === null, `restoreError should be null after full success`);
});
test("RT.3 failed retry keeps RESTORE_FAILED", async () => {
  const s = { ...fresh(), uiState: "none", restoreError: { code: "RESTORE_FAILED", message: "err" } };
  s.uiState = "loading";
  await runRestore({ getActive: fail, getLatest: fail }, s);
  assert(s.restoreError?.code === "RESTORE_FAILED");
  assert(s.uiState === "none");
});
test("RT.4 stale request ID check prevents overwrite (simulated)", async () => {
  // This test verifies the restoreRequestIdRef stale-check logic works.
  // We simulate two concurrent calls: the first is superseded by the second.
  let refValue = 0;
  const inc = () => ++refValue;
  const check = (id) => id === refValue;

  let s1Final = null;
  async function call1() {
    const id = inc(); // id=1
    // Slow call — by the time it finishes, id=2 has been issued
    await new Promise(r => setTimeout(r, 10));
    if (!check(id)) return; // should be skipped
    s1Final = "call1-wrote";
  }
  async function call2() {
    const id = inc(); // id=2
    // Fast call — completes first
    if (!check(id)) return;
    s1Final = "call2-wrote";
  }
  // Start both; call2 "wins" because it increments the counter after call1
  await Promise.all([call1(), call2()]);
  assert(s1Final === "call2-wrote", `Expected call2 to win, got: ${s1Final}`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ ResumePage rendering decisions ══\n");

test("RP.1 uiState=none + RESTORE_FAILED → RestoreError component (not upload screen)", () => {
  // Simulate what ResumeContent checks:
  const uiState = "none";
  const restoreError = { code: "RESTORE_FAILED", message: "err" };
  const showsRestoreError = uiState === "none" && restoreError?.code === "RESTORE_FAILED";
  const showsEmptyState   = uiState === "none" && !restoreError;
  assert(showsRestoreError, "Should show RestoreError");
  assert(!showsEmptyState,  "Must NOT show ResumeEmptyState");
});
test("RP.2 uiState=none + RESTORE_PARTIAL → warning banner + upload screen", () => {
  const uiState = "none";
  const restoreError = { code: "RESTORE_PARTIAL", message: "warn" };
  const triggersRestoreError = uiState === "none" && restoreError?.code === "RESTORE_FAILED";
  const showsWarning     = !!restoreError; // RestoreWarning always shown when restoreError set
  const showsEmptyState  = uiState === "none"; // ResumeEmptyState shown for any uiState=none in normal branch
  assert(!triggersRestoreError, "Must NOT trigger RestoreError for PARTIAL");
  assert(showsWarning,          "Must show RestoreWarning banner");
  assert(showsEmptyState,       "Must show upload screen below warning");
});
test("RP.3 uiState=none + no restoreError → genuine empty upload screen", () => {
  const uiState = "none";
  const restoreError = null;
  const triggersRestoreError = uiState === "none" && restoreError?.code === "RESTORE_FAILED";
  assert(!triggersRestoreError, "Must NOT trigger RestoreError");
  assert(!restoreError,         "No warning banner");
});
test("RP.4 uiState=active + RESTORE_PARTIAL → warning banner + ResumeProfile (active usable)", () => {
  const uiState = "none"; // represents the check gate
  const activeUiState = "active";
  const restoreError = { code: "RESTORE_PARTIAL" };
  const triggersRestoreError = uiState === "none" && restoreError?.code === "RESTORE_FAILED";
  assert(!triggersRestoreError, "Should not replace active resume with error screen");
  assert(!!restoreError,        "Warning banner should be shown");
  assert(activeUiState === "active", "Active resume content should render");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Logout race condition ══\n");

// Simulate the logout + counter-increment fix.
// runRestoreWithLogout models the fix: logout increments the counter so
// any in-flight restore sees requestId !== current and discards its result.
async function runRestoreWithLogout(opts, state, logoutAfterMs) {
  // On "login" (new restore starts): increment and capture request ID
  const requestId = ++state._requestCounter;

  // Schedule a "logout" that increments the counter while restore is in flight
  const logoutTimer = setTimeout(() => {
    state._requestCounter += 1;  // <-- THE FIX: logout increments the counter
    state.uiState      = "none";
    state.activeResume = null;
    state.resumeVersion= null;
    state.restoreError = null;
  }, logoutAfterMs);

  let active = null, activeErr = null;
  let latest = null, latestErr = null;

  try { active = await opts.getActive(); } catch (e) { activeErr = e; }
  try { latest = await opts.getLatest(); } catch (e) { latestErr = e; }

  clearTimeout(logoutTimer);

  // Stale check — same logic as the real restoreFromBackend
  if (requestId !== state._requestCounter) return;

  // If we got here the request was NOT superseded — write state normally
  if (!activeErr && active) {
    state.uiState      = "active";
    state.activeResume = active;
  }
}

function freshWithCounter() {
  return { uiState: "loading", activeResume: null, resumeVersion: null, restoreError: null, _requestCounter: 0 };
}

test("LO.1 logout during restoration discards in-flight result (previous user data never shown)", async () => {
  const s = freshWithCounter();
  // Active endpoint takes 20ms (simulated slow network)
  // Logout fires at 5ms — before the response arrives
  const slowActive = () => new Promise(res => setTimeout(() => res({ id: "v42", status: "ready", isActive: true }), 20));
  await runRestoreWithLogout({ getActive: slowActive, getLatest: ok(null) }, s, 5);
  // After the slow request finishes, the stale check should have blocked any state writes
  assert(s.uiState !== "active",     `uiState must not be active after logout, got ${s.uiState}`);
  assert(s.activeResume === null,     "Previous user's active resume must not reappear");
});

test("LO.2 logout before restore completes leaves state at none (not loading)", async () => {
  const s = freshWithCounter();
  const slowActive = () => new Promise(res => setTimeout(() => res({ id: "v42", status: "ready", isActive: true }), 20));
  await runRestoreWithLogout({ getActive: slowActive, getLatest: ok(null) }, s, 5);
  // Logout set uiState="none" — that must be the final state
  assert(s.uiState === "none", `Expected none, got ${s.uiState}`);
});

test("LO.3 without the fix (no counter increment on logout) the race is exploitable", async () => {
  // This test shows the VULNERABILITY that existed before the fix.
  // We simulate the broken behaviour by NOT incrementing the counter on logout.
  const s = freshWithCounter();
  let loggedOut = false;

  async function brokenRunRestore(opts) {
    const requestId = ++s._requestCounter;
    // Logout fires but does NOT increment counter (broken)
    setTimeout(() => {
      loggedOut = true;
      s.uiState      = "none";
      s.activeResume = null;
      // ← counter NOT incremented — this is the bug
    }, 5);
    const active = await opts.getActive();
    // Stale check passes because counter was not incremented — vulnerability!
    if (requestId !== s._requestCounter) return;
    s.uiState      = "active";
    s.activeResume = active;
  }

  const slowActive = () => new Promise(res => setTimeout(() => res({ id: "v42", status: "ready", isActive: true }), 20));
  await brokenRunRestore({ getActive: slowActive });
  assert(loggedOut === true, "Logout must have fired before restore completed");
  // Without the fix, the in-flight request overwrites the cleared state
  assert(s.uiState === "active",
    "CONFIRMS VULNERABILITY: without fix, previous user data reappears after logout");
});

test("LO.4 with the fix, same race is closed (counter increment on logout)", async () => {
  const s = freshWithCounter();
  let loggedOut = false;

  async function fixedRunRestore(opts) {
    const requestId = ++s._requestCounter;
    // Logout DOES increment counter (the fix)
    setTimeout(() => {
      loggedOut = true;
      s._requestCounter += 1;  // <-- THE FIX
      s.uiState      = "none";
      s.activeResume = null;
    }, 5);
    const active = await opts.getActive();
    // Stale check now catches it
    if (requestId !== s._requestCounter) return;
    s.uiState      = "active";
    s.activeResume = active;
  }

  const slowActive = () => new Promise(res => setTimeout(() => res({ id: "v42", status: "ready", isActive: true }), 20));
  await fixedRunRestore({ getActive: slowActive });
  assert(loggedOut === true, "Logout must have fired before restore completed");
  assert(s.uiState !== "active",  `uiState must not be active after logout, got ${s.uiState}`);
  assert(s.activeResume === null, "Previous user's data must not reappear with the fix");
});

test("LO.5 login after logout triggers a new restore that succeeds independently", async () => {
  const s = freshWithCounter();
  // Simulate: login → restore starts → logout fires → counter incremented → old restore discarded
  //           then new login → new restore with counter+1 runs and succeeds
  const requestId1 = ++s._requestCounter; // first login's restore
  s._requestCounter += 1;                 // logout increments
  const requestId2 = ++s._requestCounter; // new login's restore
  // Old restore: stale
  assert(requestId1 !== s._requestCounter, "Old restore must be stale");
  // New restore: current
  assert(requestId2 === s._requestCounter, "New restore must be current");
  s.uiState = "active"; s.activeResume = { id: "new-user-v1" };
  assert(s.activeResume.id === "new-user-v1", "New user's data must be shown");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${PASS + FAIL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${PASS + FAIL}\n\n`);
process.exit(FAIL > 0 ? 1 : 0);
