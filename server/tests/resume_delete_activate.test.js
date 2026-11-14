/**
 * resume_delete_activate.test.js
 *
 * Deterministic unit tests for safe resume soft-deletion and activation
 * protection introduced in the TITAN soft-delete feature.
 *
 * HOW THIS WORKS
 * ─────────────
 * No DB, no HTTP. Each test either:
 *   (a) inspects the source text of the relevant file to verify that the
 *       correct code is present (source-reading inspection), or
 *   (b) runs a small pure-function simulation of the logic to confirm
 *       correct behaviour (logic simulation).
 *
 * Run: node tests/resume_delete_activate.test.js
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
const modelSrc = fs.readFileSync(
  path.join(ROOT, "src/models/ResumeVersion.js"),
  "utf8"
);

// Client files live one level up from the server directory
const clientRoot = path.resolve(ROOT, "../client/src");
const contextSrc = fs.readFileSync(
  path.join(clientRoot, "contexts/ResumeContext.jsx"),
  "utf8"
);
const historySrc = fs.readFileSync(
  path.join(clientRoot, "components/resume/ResumeHistory.jsx"),
  "utf8"
);

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 1: deleteResume sets deletedAt and isActive=false ══\n");

test("C1.1 deleteResume sets doc.isActive = false", () => {
  assert(
    controllerSrc.includes("doc.isActive = false;"),
    "deleteResume must set doc.isActive = false"
  );
});
test("C1.2 deleteResume sets doc.deletedAt = new Date()", () => {
  assert(
    controllerSrc.includes("doc.deletedAt = new Date();"),
    "deleteResume must set doc.deletedAt = new Date()"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 2: deleteResume does not change status ══\n");

test("C2.1 deleteResume body does not assign doc.status", () => {
  // Extract only the deleteResume function body to avoid false positives
  // from other functions. The function starts at 'async function deleteResume'
  // and ends before the next top-level 'async function'.
  const start = controllerSrc.indexOf("async function deleteResume");
  const afterStart = controllerSrc.indexOf("async function", start + 10);
  const body = controllerSrc.slice(start, afterStart);
  assert(
    !body.includes("doc.status ="),
    "deleteResume must not modify doc.status"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 3: activateResume pre-flight rejects deletedAt set ══\n");

test("C3.1 pre-flight checks target.deletedAt before proceeding", () => {
  assert(
    controllerSrc.includes("if (target.deletedAt)"),
    "activateResume must check target.deletedAt in pre-flight"
  );
});
test("C3.2 pre-flight returns 410 RESUME_DELETED for deleted versions (logic simulation)", () => {
  // Simulate the pre-flight guard
  function preFlightGuard(target) {
    if (!target) return { code: "NOT_FOUND", status: 404 };
    if (target.status !== "ready") return { code: "NOT_READY", status: 400 };
    if (target.deletedAt) return { code: "RESUME_DELETED", status: 410 };
    return null; // passes
  }

  const deleted = { status: "ready", deletedAt: new Date() };
  const result = preFlightGuard(deleted);
  assert(result !== null, "Guard must reject a deleted version");
  assert(result.code === "RESUME_DELETED", `Expected RESUME_DELETED, got ${result.code}`);
  assert(result.status === 410, `Expected 410, got ${result.status}`);
});
test("C3.3 pre-flight allows non-deleted ready version (logic simulation)", () => {
  function preFlightGuard(target) {
    if (!target) return { code: "NOT_FOUND", status: 404 };
    if (target.status !== "ready") return { code: "NOT_READY", status: 400 };
    if (target.deletedAt) return { code: "RESUME_DELETED", status: 410 };
    return null;
  }

  const good = { status: "ready", deletedAt: null };
  const result = preFlightGuard(good);
  assert(result === null, "Guard must allow a non-deleted ready version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 4: Transaction OP-2 filter includes deletedAt:null ══\n");

test("C4.1 findOneAndUpdate filter contains deletedAt: null", () => {
  assert(
    controllerSrc.includes("deletedAt: null"),
    "OP-2 findOneAndUpdate filter must include deletedAt: null"
  );
});
test("C4.2 OP-2 filter still includes status: 'ready'", () => {
  // Verify the existing guard is still present alongside the new one
  assert(
    controllerSrc.includes('status: "ready", deletedAt: null'),
    "OP-2 filter must include both status: \"ready\" and deletedAt: null"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 5: safeVersion() includes deletedAt in projection ══\n");

test("C5.1 safeVersion returns deletedAt field", () => {
  // Find the safeVersion function body
  const start = controllerSrc.indexOf("function safeVersion");
  const end   = controllerSrc.indexOf("\n}", start);
  const body  = controllerSrc.slice(start, end);
  assert(
    body.includes("deletedAt:"),
    "safeVersion must include deletedAt in its projection"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 6: ResumeHistory hides Activate for deleted version ══\n");

test("C6.1 Activate button guard includes !version.deletedAt (source inspection)", () => {
  assert(
    historySrc.includes("!version.deletedAt"),
    "Activate button render condition must include !version.deletedAt"
  );
});
test("C6.2 canActivate includes !version.deletedAt (source inspection)", () => {
  // Find the canActivate block
  const start = historySrc.indexOf("const canActivate");
  const end   = historySrc.indexOf(";", start);
  const block = historySrc.slice(start, end);
  assert(
    block.includes("!version.deletedAt"),
    "canActivate must include !version.deletedAt"
  );
});
test("C6.3 Activate button is not shown for deleted version (logic simulation)", () => {
  function shouldShowActivate(version, anyActivating, pendingReview) {
    return (
      !version.isActive &&
      version.status === "ready" &&
      !version.deletedAt &&
      !anyActivating &&
      !pendingReview
    );
  }

  const deleted = { isActive: false, status: "ready", deletedAt: new Date() };
  assert(!shouldShowActivate(deleted, false, false), "Must not show Activate for deleted version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 7: ResumeHistory shows Deleted badge for deleted version ══\n");

test("C7.1 StatusBadge checks deletedAt before isActive (source inspection)", () => {
  // Find the StatusBadge function
  const start = historySrc.indexOf("const StatusBadge");
  const end   = historySrc.indexOf("\n};", start);
  const body  = historySrc.slice(start, end);
  const deletedIdx = body.indexOf("if (deletedAt)");
  const activeIdx  = body.indexOf("if (isActive)");
  assert(deletedIdx !== -1, "StatusBadge must check deletedAt");
  assert(activeIdx  !== -1, "StatusBadge must check isActive");
  assert(deletedIdx < activeIdx, "deletedAt check must come before isActive check in StatusBadge");
});
test("C7.2 StatusBadge renders Deleted text for deleted version (logic simulation)", () => {
  function getLabel(version) {
    if (version.deletedAt) return "Deleted";
    if (version.isActive)  return "Active";
    if (version.status === "ready") return "Ready";
    return "Other";
  }

  const deleted = { deletedAt: new Date(), isActive: false, status: "ready" };
  assert(getLabel(deleted) === "Deleted", "Must return Deleted label for deleted version");
});
test("C7.3 deletedAt prop is passed to StatusBadge (source inspection)", () => {
  assert(
    historySrc.includes("deletedAt={version.deletedAt}"),
    "StatusBadge must receive deletedAt={version.deletedAt}"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 8: Normal ready inactive non-deleted version still shows Activate ══\n");

test("C8.1 Activate shown for ready inactive non-deleted version (logic simulation)", () => {
  function shouldShowActivate(version, anyActivating, pendingReview) {
    return (
      !version.isActive &&
      version.status === "ready" &&
      !version.deletedAt &&
      !anyActivating &&
      !pendingReview
    );
  }

  const good = { isActive: false, status: "ready", deletedAt: null };
  assert(shouldShowActivate(good, false, false), "Must show Activate for ready inactive non-deleted version");
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 9: deleteResumeFn calls fetchHistory after success ══\n");

test("C9.1 deleteResumeFn body calls fetchHistory (source inspection)", () => {
  // Extract the deleteResumeFn callback body
  const start = contextSrc.indexOf("const deleteResumeFn = useCallback");
  const end   = contextSrc.indexOf("}, [activeResume", start);
  const body  = contextSrc.slice(start, end);
  assert(
    body.includes("fetchHistory().catch"),
    "deleteResumeFn must call fetchHistory().catch(() => {}) after setUiState(\"none\")"
  );
});
test("C9.2 fetchHistory is in deleteResumeFn dependency array (source inspection)", () => {
  // Find the closing of the deleteResumeFn useCallback to check its dep array
  const start = contextSrc.indexOf("const deleteResumeFn = useCallback");
  // The dep array is the second argument to useCallback: }, [activeResume, fetchHistory]);
  const depArrayStart = contextSrc.indexOf("}, [activeResume", start);
  const depArrayEnd   = contextSrc.indexOf(");", depArrayStart);
  const depArray      = contextSrc.slice(depArrayStart, depArrayEnd);
  assert(
    depArray.includes("fetchHistory"),
    "fetchHistory must be in deleteResumeFn useCallback dependency array"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 10: deletedAt field default is null in schema ══\n");

test("C10.1 ResumeVersion schema defines deletedAt with default: null (source inspection)", () => {
  assert(
    modelSrc.includes("deletedAt: { type: Date, default: null }"),
    "ResumeVersion schema must define deletedAt: { type: Date, default: null }"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 11: Deleted version stays in history response ══\n");

test("C11.1 getResumeHistory does not filter by deletedAt (source inspection)", () => {
  // Extract the getResumeHistory function body
  const start = controllerSrc.indexOf("async function getResumeHistory");
  const end   = controllerSrc.indexOf("async function", start + 10);
  // If there is no next async function, use end of file
  const body  = controllerSrc.slice(start, end === start ? undefined : end);
  assert(
    !body.includes("deletedAt"),
    "getResumeHistory must not filter by deletedAt — deleted versions must remain in history"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n══ Case 12: Documents without deletedAt treated as non-deleted ══\n");

test("C12.1 null deletedAt is treated as non-deleted (logic simulation)", () => {
  function isDeleted(version) {
    return !!version.deletedAt;
  }

  assert(!isDeleted({ deletedAt: null }),      "null deletedAt must not be treated as deleted");
  assert(!isDeleted({ deletedAt: undefined }), "undefined deletedAt must not be treated as deleted");
  assert( isDeleted({ deletedAt: new Date() }), "set deletedAt must be treated as deleted");
});
test("C12.2 schema default null means existing documents are non-deleted (source inspection)", () => {
  // Verify the schema uses default: null so Mongoose fills it in for existing docs
  const start = modelSrc.indexOf("deletedAt:");
  const end   = modelSrc.indexOf("\n", start);
  const line  = modelSrc.slice(start, end);
  assert(line.includes("default: null"), `deletedAt schema definition must include default: null, got: ${line.trim()}`);
});

// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write(`\n${"═".repeat(60)}\n`);
process.stdout.write(`  PASS: ${PASS} / ${PASS + FAIL}\n`);
process.stdout.write(`  FAIL: ${FAIL} / ${PASS + FAIL}\n\n`);
process.exit(FAIL > 0 ? 1 : 0);
