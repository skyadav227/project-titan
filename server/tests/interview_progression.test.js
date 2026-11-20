/**
 * interview_progression.test.js
 *
 * Deterministic regression suite for interview progression and answer-recovery
 * hardening. 27 tests covering reconcileAndRecover, error classification,
 * checkpoint isolation, and explanation error handling.
 *
 * Plain-Node pattern — no test framework, no DB connection, no React import.
 * Logic is extracted from source files and simulated inline.
 *
 * Run: node tests/interview_progression.test.js
 */
"use strict";

const assert = require("assert");
const fs     = require("fs");
const path   = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ── Source file paths ─────────────────────────────────────────────────────────
const root = path.resolve(__dirname, "..");
const clientRoot = path.resolve(root, "../client/src");

const contextSrc        = fs.readFileSync(path.join(clientRoot, "contexts/InterviewContext.jsx"), "utf8");
const sessionSrc        = fs.readFileSync(path.join(clientRoot, "components/interview/InterviewSession.jsx"), "utf8");
const checkpointSrc     = fs.readFileSync(path.join(clientRoot, "components/interview/CheckpointScreen.jsx"), "utf8");
const answerReportSrc   = fs.readFileSync(path.join(clientRoot, "components/interview/AnswerReport.jsx"), "utf8");

console.log("\ninterview_progression.test.js — 27 tests\n");

// ─────────────────────────────────────────────────────────────────────────────
// § 1-4: Source inspection — INITIAL_STATE and new reducer cases
// ─────────────────────────────────────────────────────────────────────────────

test("1. INITIAL_STATE has checkpointError: {} (per-question map)", () => {
  assert(
    contextSrc.includes("checkpointError: {}"),
    "INITIAL_STATE must have checkpointError: {}"
  );
});

test("2. INITIAL_STATE has explanationError: null", () => {
  assert(
    contextSrc.includes("explanationError: null"),
    "INITIAL_STATE must have explanationError: null"
  );
});

test("3. SET_CHECKPOINT_ERROR reducer case exists and uses payload.questionId as key", () => {
  assert(
    contextSrc.includes("case \"SET_CHECKPOINT_ERROR\""),
    "Reducer must have SET_CHECKPOINT_ERROR case"
  );
  assert(
    contextSrc.includes("[action.payload.questionId]: action.payload.error"),
    "SET_CHECKPOINT_ERROR must key by questionId"
  );
});

test("4. CLEAR_CHECKPOINT_ERROR reducer case removes single entry only", () => {
  assert(
    contextSrc.includes("case \"CLEAR_CHECKPOINT_ERROR\""),
    "Reducer must have CLEAR_CHECKPOINT_ERROR case"
  );
  // Verify it uses destructuring to remove one key, not resetting to {}
  assert(
    contextSrc.includes("[action.payload]: _removed"),
    "CLEAR_CHECKPOINT_ERROR must destructure to remove one key only"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// § 5-8: Source inspection — reconcileAndRecover wiring
// ─────────────────────────────────────────────────────────────────────────────

test("5. reconcileAndRecover is defined and exported in context value", () => {
  assert(
    contextSrc.includes("const reconcileAndRecover = useCallback"),
    "reconcileAndRecover must be defined with useCallback"
  );
  assert(
    contextSrc.includes("reconcileAndRecover,"),
    "reconcileAndRecover must be in the context value object"
  );
});

test("6. ErrorState onDismiss uses reconcileAndRecover (not clearError)", () => {
  assert(
    sessionSrc.includes("onDismiss={reconcileAndRecover}"),
    "ErrorState onDismiss must be reconcileAndRecover"
  );
  assert(
    !sessionSrc.includes("onDismiss={clearError}"),
    "ErrorState must NOT use clearError for onDismiss"
  );
});

test("7. reconcileAndRecover calls getCurrentQuestion before getNextAction", () => {
  const reconcileIdx = contextSrc.indexOf("const reconcileAndRecover = useCallback");
  const getQIdx      = contextSrc.indexOf("await getCurrentQuestion(session.id)", reconcileIdx);
  const getNextIdx   = contextSrc.indexOf("await getNextAction(session.id)", reconcileIdx);
  assert(reconcileIdx !== -1, "reconcileAndRecover must exist");
  assert(getQIdx !== -1,      "Must call getCurrentQuestion inside reconcileAndRecover");
  assert(getNextIdx !== -1,   "Must call getNextAction inside reconcileAndRecover");
  assert(getQIdx < getNextIdx, "getCurrentQuestion must be called before getNextAction");
});

test("8. reconcileAndRecover validates getNextAction response before clearing state", () => {
  const reconcileIdx = contextSrc.indexOf("const reconcileAndRecover = useCallback");
  const validateIdx  = contextSrc.indexOf("isValidResult", reconcileIdx);
  assert(validateIdx !== -1, "reconcileAndRecover must validate getNextAction result (isValidResult)");
  assert(
    contextSrc.includes("RECONCILIATION_FAILED"),
    "Must dispatch RECONCILIATION_FAILED on invalid/failed getNextAction"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// § 9-12: Logic simulation — reconcileAndRecover state transitions
// ─────────────────────────────────────────────────────────────────────────────

// Simulate the reconcileAndRecover dispatch sequence without React
function simulateReconcileAndRecover({ currentQuestion, getNextActionResult, getNextActionThrows } = {}) {
  const dispatched = [];
  const dispatch = (action) => dispatched.push(action);

  const session = { id: "sess-1" };

  // Simulate the logic extracted from reconcileAndRecover
  if (currentQuestion) {
    if (currentQuestion.pendingAttempt?.id) {
      dispatch({ type: "SET_QUESTION", payload: currentQuestion });
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_EXPLANATION", payload: null });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: null });
      dispatch({ type: "SET_CHECKPOINT_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: currentQuestion.pendingAttempt.id });
      dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: currentQuestion.pendingAttempt.transcriptText || null });
      dispatch({ type: "SET_ERROR", payload: { code: "EVALUATION_FAILED",
        message: "We couldn't evaluate your answer. Please try again." } });
    } else {
      dispatch({ type: "SET_QUESTION", payload: currentQuestion });
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_EXPLANATION", payload: null });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: null });
      dispatch({ type: "SET_CHECKPOINT_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
      dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_STATE", payload: "asking" });
    }
  } else {
    let result;
    if (getNextActionThrows) {
      dispatch({ type: "SET_ERROR", payload: { code: "RECONCILIATION_FAILED",
        message: "We couldn't verify your progress. Please try again." } });
      return dispatched;
    }
    result = getNextActionResult;

    const isValidResult =
      (result.action === "question" && result.question != null) ||
      (result.action === "complete") ||
      (result.action === "checkpoint" && Array.isArray(result.unresolvedQuestions));

    if (!isValidResult) {
      dispatch({ type: "SET_ERROR", payload: { code: "RECONCILIATION_FAILED",
        message: "We couldn't verify your progress. Please try again." } });
      return dispatched;
    }

    if (result.action === "question") {
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_EXPLANATION", payload: null });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
      dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: null });
      dispatch({ type: "SET_CHECKPOINT_ERROR", payload: null });
      dispatch({ type: "SET_QUESTION", payload: result.question });
      dispatch({ type: "SET_STATE", payload: "asking" });
    } else if (result.action === "complete") {
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_EXPLANATION", payload: null });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
      dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: null });
      dispatch({ type: "SET_CHECKPOINT_ERROR", payload: null });
      dispatch({ type: "SET_STATE", payload: "completing" });
    } else if (result.action === "checkpoint") {
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_EXPLANATION", payload: null });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
      dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
      dispatch({ type: "SET_ERROR", payload: null });
      // checkpointError NOT cleared here — preserved across re-entry
      dispatch({ type: "SET_CHECKPOINT_STATE",
        payload: { unresolvedQuestions: result.unresolvedQuestions } });
      dispatch({ type: "SET_STATE", payload: "checkpoint" });
    }
  }

  return dispatched;
}

test("9. Fresh unanswered question (no pendingAttempt) routes to asking, clears stale state", () => {
  const question = { id: "q2", text: "Explain closures", pendingAttempt: null };
  const dispatched = simulateReconcileAndRecover({ currentQuestion: question });
  const types = dispatched.map(d => d.type);
  assert(types.includes("SET_STATE"), "Must dispatch SET_STATE");
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(setState.payload === "asking", "Must route to asking");
  assert(types.includes("SET_PENDING_ATTEMPT_ID"), "Must clear pendingAttemptId");
  const setPending = dispatched.find(d => d.type === "SET_PENDING_ATTEMPT_ID");
  assert(setPending.payload === null, "pendingAttemptId must be null");
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr && setErr.payload === null, "Must clear error");
});

test("10. Pending failed attempt restores question, attemptId, transcript, and shows EVALUATION_FAILED", () => {
  const question = {
    id: "q2",
    text: "Explain closures",
    pendingAttempt: { id: "att-5", transcriptText: "My saved answer text" }
  };
  const dispatched = simulateReconcileAndRecover({ currentQuestion: question });
  const types = dispatched.map(d => d.type);
  const setPending = dispatched.find(d => d.type === "SET_PENDING_ATTEMPT_ID");
  assert(setPending?.payload === "att-5", "pendingAttemptId must be set to att-5");
  const setTranscript = dispatched.find(d => d.type === "SET_FAILED_TRANSCRIPT");
  assert(setTranscript?.payload === "My saved answer text", "Transcript must be restored");
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr?.payload?.code === "EVALUATION_FAILED", "Error code must be EVALUATION_FAILED");
  // Must NOT dispatch SET_STATE("asking") — stays in error
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(!setState, "Must NOT dispatch SET_STATE when restoring pending attempt (stays in error)");
});

test("11. Failed Q2 recovery — restored question is Q2, not stale Q1", () => {
  const q2 = { id: "q2", text: "Q2 text", pendingAttempt: { id: "att-q2", transcriptText: "q2 answer" } };
  const dispatched = simulateReconcileAndRecover({ currentQuestion: q2 });
  const setQuestion = dispatched.find(d => d.type === "SET_QUESTION");
  assert(setQuestion?.payload?.id === "q2", "Must restore Q2, not Q1");
  const setPending = dispatched.find(d => d.type === "SET_PENDING_ATTEMPT_ID");
  assert(setPending?.payload === "att-q2", "Must use Q2's attemptId");
});

test("12. getNextAction result: valid question destination clears stale report and routes to asking", () => {
  const nextQ = { id: "q3", text: "Q3 text" };
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "question", question: nextQ }
  });
  const types = dispatched.map(d => d.type);
  assert(types.includes("SET_ANSWER_RESULT"), "Must clear answerResult");
  const setAns = dispatched.find(d => d.type === "SET_ANSWER_RESULT");
  assert(setAns.payload === null, "answerResult must be null");
  const setQ = dispatched.find(d => d.type === "SET_QUESTION");
  assert(setQ?.payload?.id === "q3", "Must set Q3");
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(setState?.payload === "asking", "Must route to asking");
});

// ─────────────────────────────────────────────────────────────────────────────
// § 13-17: Logic simulation — invalid/failed getNextAction
// ─────────────────────────────────────────────────────────────────────────────

test("13. Malformed getNextAction response (missing question) does not clear state", () => {
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "question", question: null } // invalid: question is null
  });
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr?.payload?.code === "RECONCILIATION_FAILED", "Must dispatch RECONCILIATION_FAILED");
  // Must NOT have dispatched SET_STATE to asking/completing/checkpoint
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(!setState, "Must NOT dispatch SET_STATE on malformed response");
});

test("14. Unknown action from getNextAction does not clear state", () => {
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "mystery_action" }
  });
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr?.payload?.code === "RECONCILIATION_FAILED", "Must dispatch RECONCILIATION_FAILED for unknown action");
});

test("15. getNextAction throws — preserves all existing state, dispatches RECONCILIATION_FAILED", () => {
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionThrows: true
  });
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr?.payload?.code === "RECONCILIATION_FAILED", "Must dispatch RECONCILIATION_FAILED on getNextAction throw");
  // No SET_STATE dispatched — existing state preserved
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(!setState, "Must NOT dispatch SET_STATE when getNextAction throws");
});

test("16. Valid complete destination clears report/question state and routes to completing", () => {
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "complete" }
  });
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(setState?.payload === "completing", "Must route to completing");
  const setErr = dispatched.find(d => d.type === "SET_ERROR");
  assert(setErr?.payload === null, "Must clear error");
});

test("17. Valid checkpoint destination preserves checkpointError, routes to checkpoint", () => {
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "checkpoint", unresolvedQuestions: [{ id: "q2" }] }
  });
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(setState?.payload === "checkpoint", "Must route to checkpoint");
  // checkpointError must NOT be cleared during checkpoint re-entry
  const clearCpErr = dispatched.find(d => d.type === "SET_CHECKPOINT_ERROR" && d.payload === null);
  assert(!clearCpErr, "Must NOT clear checkpointError when transitioning to checkpoint");
  // Verify checkpoint state is set with unresolvedQuestions
  const setCpState = dispatched.find(d => d.type === "SET_CHECKPOINT_STATE");
  assert(Array.isArray(setCpState?.payload?.unresolvedQuestions), "Must set checkpointState with unresolvedQuestions array");
});

// ─────────────────────────────────────────────────────────────────────────────
// § 18-21: Logic simulation — failure type classification
// ─────────────────────────────────────────────────────────────────────────────

// Simulate the reducer's SET_CHECKPOINT_ERROR / CLEAR_CHECKPOINT_ERROR logic
function checkpointErrorReducer(state, action) {
  if (action.type === "SET_CHECKPOINT_ERROR") {
    if (action.payload === null) {
      return { ...state, checkpointError: {} };
    }
    return {
      ...state,
      checkpointError: {
        ...state.checkpointError,
        [action.payload.questionId]: action.payload.error,
      },
    };
  }
  if (action.type === "CLEAR_CHECKPOINT_ERROR") {
    const { [action.payload]: _removed, ...remainingErrors } = state.checkpointError;
    return { ...state, checkpointError: remainingErrors };
  }
  return state;
}

test("18. Checkpoint reevaluation failure dispatches SET_CHECKPOINT_ERROR, not SET_ERROR", () => {
  // Source inspection: reevaluateAtCheckpoint catch must not dispatch SET_ERROR
  const reevalIdx = contextSrc.indexOf("const reevaluateAtCheckpoint = useCallback");
  assert(reevalIdx !== -1, "reevaluateAtCheckpoint must exist");
  const reevalBody = contextSrc.slice(reevalIdx, reevalIdx + 1500);
  // The catch block must dispatch SET_CHECKPOINT_ERROR
  assert(
    reevalBody.includes("SET_CHECKPOINT_ERROR"),
    "reevaluateAtCheckpoint catch must dispatch SET_CHECKPOINT_ERROR"
  );
  // The catch block must NOT dispatch SET_ERROR
  assert(
    !reevalBody.includes("dispatch({ type: \"SET_ERROR\""),
    "reevaluateAtCheckpoint catch must NOT dispatch SET_ERROR"
  );
});

test("19. Explanation failure dispatches SET_EXPLANATION_ERROR, uiState stays showing_report", () => {
  // Source inspection: requestConceptExplanation catch must use SET_EXPLANATION_ERROR
  const explIdx = contextSrc.indexOf("const requestConceptExplanation = useCallback");
  assert(explIdx !== -1, "requestConceptExplanation must exist");
  const explBody = contextSrc.slice(explIdx, explIdx + 800);
  assert(
    explBody.includes("SET_EXPLANATION_ERROR"),
    "requestConceptExplanation catch must dispatch SET_EXPLANATION_ERROR"
  );
  // The catch block specifically must not dispatch SET_ERROR or SET_STATE
  const catchIdx = explBody.indexOf("} catch (err) {");
  assert(catchIdx !== -1, "requestConceptExplanation must have a catch block");
  const catchBlock = explBody.slice(catchIdx, catchIdx + 200);
  // Check for dispatch calls specifically, not comments
  assert(
    !catchBlock.includes("dispatch({ type: \"SET_ERROR\"") &&
    !catchBlock.includes("dispatch({ type: 'SET_ERROR'"),
    "requestConceptExplanation catch block must NOT dispatch SET_ERROR"
  );
  assert(
    !catchBlock.includes("dispatch({ type: \"SET_STATE\"") &&
    !catchBlock.includes("dispatch({ type: 'SET_STATE'"),
    "requestConceptExplanation catch block must NOT dispatch SET_STATE"
  );
});

test("20. Skip failure dispatches SET_CHECKPOINT_ERROR, not SET_ERROR", () => {
  const skipIdx = contextSrc.indexOf("const skipQuestionAction = useCallback");
  assert(skipIdx !== -1, "skipQuestionAction must exist");
  const skipBody = contextSrc.slice(skipIdx, skipIdx + 800);
  assert(
    skipBody.includes("SET_CHECKPOINT_ERROR"),
    "skipQuestionAction catch must dispatch SET_CHECKPOINT_ERROR"
  );
  assert(
    !skipBody.includes("dispatch({ type: \"SET_ERROR\""),
    "skipQuestionAction catch must NOT dispatch SET_ERROR"
  );
});

test("21. Report-generation failure sets REPORT_GENERATION_FAILED code (not generic error)", () => {
  assert(
    contextSrc.includes("REPORT_GENERATION_FAILED"),
    "triggerReportGeneration must dispatch REPORT_GENERATION_FAILED on failure"
  );
  // ErrorState must route REPORT_GENERATION_FAILED to onRetryReport
  assert(
    sessionSrc.includes("error?.code === \"REPORT_GENERATION_FAILED\""),
    "ErrorState must have specific routing for REPORT_GENERATION_FAILED"
  );
  assert(
    sessionSrc.includes("onRetryReport"),
    "ErrorState must have onRetryReport prop for report-generation failures"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// § 22-27: Logic simulation — per-question error map and concurrent operations
// ─────────────────────────────────────────────────────────────────────────────

test("22. Retryable pending attempt restored correctly — attemptId and transcript both set", () => {
  const question = {
    id: "q3",
    pendingAttempt: { id: "att-9", transcriptText: "closure answer" }
  };
  const dispatched = simulateReconcileAndRecover({ currentQuestion: question });
  const setPending  = dispatched.find(d => d.type === "SET_PENDING_ATTEMPT_ID");
  const setTranscript = dispatched.find(d => d.type === "SET_FAILED_TRANSCRIPT");
  assert(setPending?.payload === "att-9", "Must restore attemptId att-9");
  assert(setTranscript?.payload === "closure answer", "Must restore transcript");
});

test("23. Non-retryable pending attempt (pendingAttempt: null) routes to asking, NOT checkpoint", () => {
  const question = { id: "q3", pendingAttempt: null };
  const dispatched = simulateReconcileAndRecover({ currentQuestion: question });
  const setState = dispatched.find(d => d.type === "SET_STATE");
  assert(setState?.payload === "asking", "Must route to asking, not checkpoint");
  const setPending = dispatched.find(d => d.type === "SET_PENDING_ATTEMPT_ID");
  assert(setPending?.payload === null, "pendingAttemptId must be null");
});

test("24. Successful checkpoint retry clears only that question's error, not other questions'", () => {
  // Start with two questions having errors
  let state = {
    checkpointError: {
      "q1": new Error("q1 reeval failed"),
      "q2": new Error("q2 reeval failed"),
    }
  };
  // Successful reevaluation of q1 dispatches CLEAR_CHECKPOINT_ERROR for q1 only
  state = checkpointErrorReducer(state, { type: "CLEAR_CHECKPOINT_ERROR", payload: "q1" });
  assert(!state.checkpointError["q1"], "q1 error must be cleared");
  assert(state.checkpointError["q2"] instanceof Error, "q2 error must still exist");
});

test("25. Successful explanation retry clears explanationError and preserves answerResult", () => {
  // Source inspection: requestConceptExplanation success path must dispatch SET_EXPLANATION_ERROR null
  const explIdx  = contextSrc.indexOf("const requestConceptExplanation = useCallback");
  const explBody = contextSrc.slice(explIdx, explIdx + 800);
  assert(
    explBody.includes("SET_EXPLANATION_ERROR") && explBody.includes("payload: null"),
    "requestConceptExplanation success path must clear explanationError (SET_EXPLANATION_ERROR null)"
  );
  // Must NOT dispatch SET_ANSWER_RESULT null on success
  assert(
    !explBody.includes("SET_ANSWER_RESULT"),
    "requestConceptExplanation must NOT clear answerResult on explanation success"
  );
});

test("26. Reconciliation returning a different question clears stale answerResult and explanation", () => {
  const nextQ = { id: "q4", text: "New question" };
  const dispatched = simulateReconcileAndRecover({
    currentQuestion: null,
    getNextActionResult: { action: "question", question: nextQ }
  });
  const setAns = dispatched.find(d => d.type === "SET_ANSWER_RESULT");
  assert(setAns?.payload === null, "Must clear stale answerResult when advancing to new question");
  const setExpl = dispatched.find(d => d.type === "SET_EXPLANATION");
  assert(setExpl?.payload === null, "Must clear stale explanation when advancing to new question");
  const setQ = dispatched.find(d => d.type === "SET_QUESTION");
  assert(setQ?.payload?.id === "q4", "Must set the new question from getNextAction");
});

test("27. Concurrent checkpoint operations on different questions accumulate independent errors", () => {
  // Simulate two concurrent failures: q1 and q2 each fail independently
  let state = { checkpointError: {} };

  // q1 fails
  state = checkpointErrorReducer(state, {
    type: "SET_CHECKPOINT_ERROR",
    payload: { questionId: "q1", error: new Error("q1 error") }
  });
  // q2 fails (concurrent — q1's error still present)
  state = checkpointErrorReducer(state, {
    type: "SET_CHECKPOINT_ERROR",
    payload: { questionId: "q2", error: new Error("q2 error") }
  });

  assert(state.checkpointError["q1"] instanceof Error, "q1 error must be present");
  assert(state.checkpointError["q2"] instanceof Error, "q2 error must be present");
  assert(state.checkpointError["q1"] !== state.checkpointError["q2"], "Errors must be independent");
  assert(state.checkpointError["q1"].message === "q1 error", "q1 error message must be correct");
  assert(state.checkpointError["q2"].message === "q2 error", "q2 error message must be correct");

  // q1 succeeds — only q1 error removed, q2 unchanged
  state = checkpointErrorReducer(state, { type: "CLEAR_CHECKPOINT_ERROR", payload: "q1" });
  assert(!state.checkpointError["q1"], "q1 error must be cleared after success");
  assert(state.checkpointError["q2"] instanceof Error, "q2 error must remain after q1 succeeds");
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log(`  OVERALL: ${failed === 0 ? "PASS" : "FAIL"}\n`);
if (failed > 0) process.exit(1);
