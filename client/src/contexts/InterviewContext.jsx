/**
 * InterviewContext
 *
 * Single state machine for Interview Intelligence.
 * All interview UI states and transitions live here.
 *
 * UI States (interview-ui-spec.md §54, interview-architecture.md §81):
 *   idle            → no active session
 *   setup           → configuration screen
 *   starting        → session being created / first question loading
 *   asking          → question displayed, ready to record
 *   listening       → microphone active, recording answer
 *   processing      → answer uploaded, waiting for evaluation
 *   showing_report  → per-question feedback displayed
 *   retrying        → same question, new attempt
 *   explaining      → explanation panel shown
 *   completing      → final question processed, generating report
 *   report_ready    → master report available (navigate to /reports/:id)
 *   error           → recoverable error state
 *
 * The backend is the SINGLE source of truth for:
 *   - current question, question order, scores, evaluation, retry eligibility
 *   - completion, report availability, session status
 * This context only manages UI interaction state and caches backend data.
 *
 * On mount (or navigation to /interview/session/:id): restores from backend.
 * When report_ready is set, reportSessionId holds the session ID so the
 * rendering component can navigate to /reports/:sessionId.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";
import {
  createInterview,
  getInterview,
  startInterview,
  getCurrentQuestion,
  getNextAction,
  submitAnswer,
  submitTextAnswer,
  getAnswerStatus,
  reevaluateAnswer,
  retryQuestion,
  requestExplanation,
  continueAfterExplanation,
  endInterview,
  generateReport,
  getReport,
  getCheckpointState,
  skipQuestion,
} from "../services/interviewService";

// ── Polling interval for answer processing status ─────────────────────────────
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 30; // ~60 seconds max

// ── Context ───────────────────────────────────────────────────────────────────
const InterviewContext = createContext(null);

// ── State shape ───────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  uiState:       "idle",      // matches the state list above
  session:       null,        // session DTO from backend
  question:      null,        // current question DTO
  answerResult:  null,        // latest evaluated answer (evaluation + feedback)
  explanation:   null,        // current explanation from backend
  report:        null,        // final report DTO
  retryInfo:     null,        // { retriesUsed, retriesRemaining }
  error:         null,        // { code, message } or null
  isLoading:     false,       // generic async flag
  pollingAttemptId: null,     // answer attempt being polled
  reportSessionId:  null,     // set when report_ready — the session ID to navigate to
  pendingAttemptId: null,     // set when a submission failed AI evaluation — routes "Try Again" to reevaluate
  failedAttemptTranscript: null,  // transcript text from a failed evaluation attempt
  checkpointState: null,      // { unresolvedQuestions, resolved? } from checkpoint endpoint
  checkpointError: {},        // { [questionId]: Error } — per-question, never mixes with global error
  explanationError: null,     // Error | null — local to showing_report, never changes uiState
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, uiState: action.payload };
    case "SET_SESSION":
      return { ...state, session: action.payload };
    case "SET_QUESTION":
      return { ...state, question: action.payload };
    case "SET_ANSWER_RESULT":
      return { ...state, answerResult: action.payload };
    case "SET_EXPLANATION":
      return { ...state, explanation: action.payload };
    case "SET_REPORT":
      return { ...state, report: action.payload };
    case "SET_RETRY_INFO":
      return { ...state, retryInfo: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, uiState: action.payload ? "error" : state.uiState };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_POLLING":
      return { ...state, pollingAttemptId: action.payload };
    case "SET_REPORT_SESSION_ID":
      return { ...state, reportSessionId: action.payload };
    case "SET_PENDING_ATTEMPT_ID":
      return { ...state, pendingAttemptId: action.payload };
    case "SET_FAILED_TRANSCRIPT":
      return { ...state, failedAttemptTranscript: action.payload };
    case "SET_CHECKPOINT_STATE":
      return { ...state, checkpointState: action.payload };
    case "SET_CHECKPOINT_ERROR":
      if (action.payload === null) {
        return { ...state, checkpointError: {} };
      }
      // action.payload = { questionId, error } — adds/updates one entry only
      return {
        ...state,
        checkpointError: {
          ...state.checkpointError,
          [action.payload.questionId]: action.payload.error,
        },
      };
    case "CLEAR_CHECKPOINT_ERROR": {
      // action.payload = questionId string — removes one entry only
      const { [action.payload]: _removed, ...remainingErrors } = state.checkpointError;
      return { ...state, checkpointError: remainingErrors };
    }
    case "SET_EXPLANATION_ERROR":
      return { ...state, explanationError: action.payload };
    case "RESET":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

// Speech transcription failures have no usable transcript — reevaluateFailedAttempt
// requires a saved transcript, so these errors must not set pendingAttemptId.
// "Try Again" for these codes calls clearError() which returns to "asking".
const FRESH_RECORDING_ERRORS = new Set([
  "SPEECH_EMPTY_TRANSCRIPT",
  "SPEECH_MALFORMED_RESPONSE",
  "TRANSCRIPTION_FAILED",
]);

export function InterviewProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const pollRef = useRef(null);
  const pollCountRef = useRef(0);

  // ── Cleanup polling on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => stopPolling();
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }

  // ── Session recovery from URL param ───────────────────────────────────────
  // getCancelled: optional () => boolean supplied by the caller. When it returns
  // true the async chain aborts without dispatching — this prevents a page that
  // has already unmounted (e.g. ReportPage) from overwriting context state that
  // a newly-mounted page (e.g. InterviewPage at /interview/setup) has already
  // correctly set via goToSetup().
  const restoreSession = useCallback(async (sessionId, getCancelled) => {
    const isCancelled = () => typeof getCancelled === "function" && getCancelled();

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const session = await getInterview(sessionId);
      if (isCancelled()) return;

      dispatch({ type: "SET_SESSION", payload: session });

      // Determine UI state from backend session status.
      // Both "completed" and "abandoned" sessions can have a generated report.
      const hasReadyReport =
        session.hasReport ||
        session.reportStatus === "ready";

      if (
        (session.status === "completed" || session.status === "abandoned") &&
        hasReadyReport
      ) {
        const report = await getReport(sessionId).catch(() => null);
        if (isCancelled()) return;
        dispatch({ type: "SET_REPORT", payload: report });
        // Also store reportSessionId so InterviewPage's guard has it
        dispatch({ type: "SET_REPORT_SESSION_ID", payload: sessionId });
        dispatch({ type: "SET_STATE", payload: "report_ready" });
        return;
      }

      if (session.status === "completing") {
        const cpState = await getCheckpointState(sessionId).catch(() => null);
        if (isCancelled()) return;
        if (cpState) {
          dispatch({ type: "SET_CHECKPOINT_STATE", payload: cpState });
        }
        dispatch({ type: "SET_STATE", payload: "checkpoint" });
        return;
      }

      if (session.status === "active") {
        // Active session — restore to asking state for /interview/session/:id
        // If this is called from ReportPage (/history/:id), the page will
        // show "no report available" which is correct — this session has no report.
        const { question } = await getCurrentQuestion(sessionId);
        if (isCancelled()) return;
        if (question) {
          dispatch({ type: "SET_QUESTION", payload: question });
          // If the question has a pending failed attempt (AI evaluation failure
        // on a prior submission), surface its ID so "Try Again" routes to
        // reevaluateAnswer instead of creating a duplicate submission.
        if (question.pendingAttempt?.id) {
            dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: question.pendingAttempt.id });
          }
          dispatch({ type: "SET_STATE", payload: "asking" });
        } else {
          dispatch({ type: "SET_STATE", payload: "asking" });
        }
        return;
      }

      // created/starting/failed/abandoned-without-report → setup
      if (!isCancelled()) {
        dispatch({ type: "SET_STATE", payload: "idle" });
      }
    } catch (err) {
      if (!isCancelled()) {
        dispatch({ type: "SET_ERROR", payload: err });
      }
    } finally {
      if (!isCancelled()) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, []);

  // ── Go to setup ───────────────────────────────────────────────────────────
  const goToSetup = useCallback(() => {
    stopPolling();
    dispatch({ type: "RESET" });
    dispatch({ type: "SET_STATE", payload: "setup" });
  }, []);

  // ── Create + start interview ───────────────────────────────────────────────
  const beginInterview = useCallback(async (config) => {
    // RESET first — clear any stale session, question, answerResult, error,
    // retryInfo, pollingAttemptId, reportSessionId from a previous interview.
    // Without this, stale state from the last session can bleed into the new one.
    stopPolling();
    dispatch({ type: "RESET" });

    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_STATE", payload: "starting" });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Create session
      const session = await createInterview(config);
      dispatch({ type: "SET_SESSION", payload: session });

      // Start session — context + first question
      const startResult = await startInterview(session.id);
      dispatch({ type: "SET_SESSION", payload: startResult.session });
      dispatch({ type: "SET_QUESTION", payload: startResult.question });
      dispatch({ type: "SET_STATE", payload: "asking" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ── Submit voice answer ───────────────────────────────────────────────────
  const submitVoiceAnswer = useCallback(async ({ audioBlob, durationMs, idempotencyKey }) => {
    const { session, question } = state;
    if (!session?.id || !question?.id) return;

    dispatch({ type: "SET_STATE", payload: "processing" });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await submitAnswer(session.id, question.id, {
        audioBlob,
        durationMs,
        idempotencyKey,
      });

      if (result.status === "completed") {
        // Synchronous processing completed — show feedback directly
        dispatch({ type: "SET_ANSWER_RESULT", payload: result });
        dispatch({ type: "SET_STATE", payload: "showing_report" });
        dispatch({ type: "SET_LOADING", payload: false });
      } else {
        // Asynchronous — start polling
        dispatch({ type: "SET_POLLING", payload: result.id });
        startPolling(session.id, result.id);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
      dispatch({ type: "SET_LOADING", payload: false });
      // SET_ERROR already transitions uiState → "error" via the reducer.
      // Do NOT dispatch SET_STATE("asking") here — that silently overrides the
      // error state, hiding the failure from the user. The ErrorState component
      // shows a "Try Again" button that calls clearError(), which returns to
      // "asking" correctly (Phase 2 fix in clearError).
      // Speech transcription failures (no usable transcript) must NOT route to
      // reevaluateFailedAttempt — the reevaluation path requires a saved transcript.
      // For these errors, pendingAttemptId remains null so "Try Again" calls
      // clearError() which returns to "asking" for a fresh recording.
      if (err?.attemptId && !FRESH_RECORDING_ERRORS.has(err.code)) {
        dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: err.attemptId });
      }
      if (err?.transcript) {
        dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: err.transcript });
      }
    }
  }, [state]);

  // ── Submit text answer (dev/test path — bypasses STT) ─────────────────────
  // Uses the submitted text directly as the transcript and routes it through
  // the same AI evaluation pipeline as voice answers.
  const submitTextAnswerAction = useCallback(async ({ text, idempotencyKey }) => {
    const { session, question } = state;
    if (!session?.id || !question?.id) return;

    dispatch({ type: "SET_STATE", payload: "processing" });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await submitTextAnswer(session.id, question.id, {
        text,
        idempotencyKey,
      });

      if (result.status === "completed") {
        dispatch({ type: "SET_ANSWER_RESULT", payload: result });
        dispatch({ type: "SET_STATE", payload: "showing_report" });
        dispatch({ type: "SET_LOADING", payload: false });
      } else {
        // Asynchronous — start polling
        dispatch({ type: "SET_POLLING", payload: result.id });
        startPolling(session.id, result.id);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
      dispatch({ type: "SET_LOADING", payload: false });
      // Same as submitVoiceAnswer: SET_ERROR already sets uiState → "error".
      // Removing the SET_STATE("asking") override so the error is visible.
      // Speech transcription failures (no usable transcript) must NOT route to
      // reevaluateFailedAttempt — the reevaluation path requires a saved transcript.
      // For these errors, pendingAttemptId remains null so "Try Again" calls
      // clearError() which returns to "asking" for a fresh recording.
      if (err?.attemptId && !FRESH_RECORDING_ERRORS.has(err.code)) {
        dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: err.attemptId });
      }
      if (err?.transcript) {
        dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: err.transcript });
      }
    }
  }, [state]);

  // ── Poll answer processing status ─────────────────────────────────────────
  const startPolling = useCallback((sessionId, attemptId) => {
    stopPolling();
    pollCountRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        dispatch({ type: "SET_ERROR", payload: { code: "ANSWER_PROCESSING", message: "Answer processing is taking longer than expected. Please try again." } });
        return;
      }

      try {
        const result = await getAnswerStatus(sessionId, attemptId);

        if (result.status === "completed") {
          stopPolling();
          dispatch({ type: "SET_POLLING", payload: null });
          dispatch({ type: "SET_ANSWER_RESULT", payload: result });
          dispatch({ type: "SET_STATE", payload: "showing_report" });
        } else if (result.status === "failed") {
          stopPolling();
          dispatch({ type: "SET_POLLING", payload: null });
          dispatch({ type: "SET_ERROR", payload: { code: result.processingError?.code || "EVALUATION_FAILED", message: "We couldn't analyze your answer. Please try again." } });
          // Route Try Again to reevaluateAnswer. The polling closure has attemptId
          // (the ID we were polling) so we can set pendingAttemptId here.
          // This prevents the E11000 duplicate-key error that occurs when
          // the user re-submits the same question that already has attemptNumber:1.
          dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: attemptId });
        }
        // still processing → keep polling
      } catch {
        // Network blip — don't fail the whole poll, just retry
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // ── Continue to next question ─────────────────────────────────────────────
  const continueToNext = useCallback(async () => {
    const { session } = state;
    if (!session?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_ANSWER_RESULT", payload: null });
    dispatch({ type: "SET_EXPLANATION", payload: null });
    dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });

    try {
      const result = await getNextAction(session.id);

      if (result.action === "complete") {
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      } else if (result.action === "checkpoint") {
        dispatch({ type: "SET_CHECKPOINT_STATE", payload: { unresolvedQuestions: result.unresolvedQuestions } });
        dispatch({ type: "SET_STATE", payload: "checkpoint" });
      } else if (result.action === "question") {
        dispatch({ type: "SET_QUESTION", payload: result.question });
        dispatch({ type: "SET_STATE", payload: "asking" });
      } else {
        // unexpected action — stay on report
        dispatch({ type: "SET_STATE", payload: "showing_report" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: { ...err, _isQuestionGenFailure: true } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── Retry current question ────────────────────────────────────────────────
  const retryCurrentQuestion = useCallback(async () => {
    const { session, question } = state;
    if (!session?.id || !question?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    // Clear pending attempt — the user is choosing to give a fresh answer
    dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });

    try {
      const result = await retryQuestion(session.id, question.id);
      dispatch({ type: "SET_QUESTION", payload: result.question });
      dispatch({ type: "SET_RETRY_INFO", payload: { retriesUsed: result.retriesUsed, retriesRemaining: result.retriesRemaining } });
      dispatch({ type: "SET_ANSWER_RESULT", payload: null });
      dispatch({ type: "SET_STATE", payload: "retrying" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── Reevaluate failed answer attempt ────────────────────────────────────
  // Re-runs AI evaluation on a previously-failed AnswerAttempt using its saved
  // transcript. Does NOT create a new attempt or consume the user's retry quota.
  // Called when the user clicks "Try Again" after an AI evaluation failure and
  // the context has a pendingAttemptId from the failed response.
  const reevaluateFailedAttempt = useCallback(async () => {
    const { session, pendingAttemptId } = state;
    if (!session?.id || !pendingAttemptId) return;

    dispatch({ type: "SET_STATE", payload: "processing" });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await reevaluateAnswer(session.id, pendingAttemptId);

      if (result.status === "completed") {
        dispatch({ type: "SET_ANSWER_RESULT", payload: result });
        dispatch({ type: "SET_STATE", payload: "showing_report" });
        dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
        dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
        dispatch({ type: "SET_LOADING", payload: false });
      } else {
        // Should not happen for synchronous V1 — but handle gracefully
        dispatch({ type: "SET_POLLING", payload: result.id });
        startPolling(session.id, result.id);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
      dispatch({ type: "SET_LOADING", payload: false });
      // Keep pendingAttemptId unless retries are exhausted — the user can try again.
      // When RETRY_LIMIT_REACHED is returned, clear pendingAttemptId so the UI
      // stops offering reevaluation and shows a "submit new answer" path instead.
      // NOT clearing it would loop indefinitely: every click fires reevaluateAnswer
      // which fails with RETRY_LIMIT_REACHED which dispatches error which shows
      // Try Again which fires reevaluateAnswer again…
      if (err.code === "RETRY_LIMIT_REACHED") {
        dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
      } else if (err?.attemptId) {
        // Still retryable — update with the attempt ID from the error (may be same)
        dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: err.attemptId });
      }
    }
  }, [state]);

  // ── Skip question at checkpoint ───────────────────────────────────────────
  const skipQuestionAction = useCallback(async (questionId) => {
    const { session } = state;
    if (!session?.id) return;

    try {
      await skipQuestion(session.id, questionId);
      // Re-fetch checkpoint state
      const cpState = await getCheckpointState(session.id);
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: cpState });
      if (cpState.resolved) {
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    }
  }, [state]);

  // ── Reevaluate at checkpoint ──────────────────────────────────────────────
  const reevaluateAtCheckpoint = useCallback(async (attemptId) => {
    const { session } = state;
    if (!session?.id || !attemptId) return;

    try {
      // isCheckpoint=true is signalled via a request header or body parameter.
      // The existing reevaluateAnswer endpoint is called; the service uses
      // CHECKPOINT_REEVAL_LIMIT when invoked from the checkpoint flow.
      // We pass a flag via a custom header so we don't change the URL contract.
      await reevaluateAnswer(session.id, attemptId, { isCheckpoint: true });
      const cpState = await getCheckpointState(session.id);
      dispatch({ type: "SET_CHECKPOINT_STATE", payload: cpState });
      if (cpState.resolved) {
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      }
    } catch (err) {
      // Re-fetch checkpoint state to reflect current retries remaining even on error
      const cpState = await getCheckpointState(session.id).catch(() => null);
      if (cpState) dispatch({ type: "SET_CHECKPOINT_STATE", payload: cpState });
      dispatch({ type: "SET_ERROR", payload: err });
    }
  }, [state]);

  // ── Re-answer at checkpoint (transcription-problem path) ─────────────────
  const reAnswerAtCheckpoint = useCallback(async (questionId) => {
    const { session } = state;
    if (!session?.id || !questionId) return;

    try {
      // retryQuestion resets the question to 'asked' and allows fresh recording
      const result = await retryQuestion(session.id, questionId);
      dispatch({ type: "SET_QUESTION", payload: result.question });
      dispatch({ type: "SET_STATE", payload: "asking" });
      // After submission completes (via continueToNext), if backend returns
      // action:'checkpoint' again, the existing continueToNext handler will
      // re-enter the checkpoint state.
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    }
  }, [state]);

  // ── Request explanation ───────────────────────────────────────────────────
  const requestConceptExplanation = useCallback(async (topic) => {
    const { session, question } = state;
    if (!session?.id || !question?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await requestExplanation(session.id, { questionId: question.id, topic });
      dispatch({ type: "SET_EXPLANATION", payload: result });
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
      dispatch({ type: "SET_STATE", payload: "explaining" });
    } catch (err) {
      dispatch({ type: "SET_EXPLANATION_ERROR", payload: err });
      // uiState stays "showing_report" — do NOT dispatch SET_ERROR or SET_STATE
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── Continue after explanation ────────────────────────────────────────────
  const continueFromExplanation = useCallback(async () => {
    const { session } = state;
    if (!session?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_EXPLANATION", payload: null });
    dispatch({ type: "SET_ANSWER_RESULT", payload: null });

    try {
      const result = await continueAfterExplanation(session.id);

      if (result.action === "complete") {
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      } else if (result.action === "question") {
        dispatch({ type: "SET_QUESTION", payload: result.question });
        dispatch({ type: "SET_STATE", payload: "asking" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: { ...err, _isQuestionGenFailure: true } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── End interview ──────────────────────────────────────────────────────────
  // reason="user_ended"  → backend sets status=abandoned, NO report generated.
  // reason="completed"   → backend sets status=completed, report IS generated.
  //
  // Idempotency: if session is already abandoned/completed, endInterview on the
  // backend returns the current state without error (see interviewService.endInterview).
  const finishInterview = useCallback(async (reason = "user_ended") => {
    const { session } = state;
    if (!session?.id) return;

    stopPolling();
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      await endInterview(session.id, reason);

      if (reason === "user_ended") {
        // Abandoned — DO NOT generate a report. Go back to setup.
        dispatch({ type: "RESET" });
        dispatch({ type: "SET_STATE", payload: "setup" });
      } else {
        // Normal completion — generate report.
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: { ...err, _isFinishFailure: true, _reason: reason } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── Generate + poll report ────────────────────────────────────────────────
  // Sets reportSessionId when ready so the rendering component (InterviewPage)
  // can navigate to /history/:sessionId — the canonical home for reports.
  // The context does not call useNavigate directly because it mounts outside
  // BrowserRouter (in App.jsx above AppRouter).
  async function triggerReportGeneration(sessionId) {
    function startReportPolling(sid) {
      let attempts = 0;
      const reportPollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 15) {
          clearInterval(reportPollInterval);
          dispatch({ type: "SET_ERROR", payload: { code: "REPORT_GENERATION_FAILED", message: "Report is taking longer than expected." } });
          return;
        }
        try {
          const r = await getReport(sid);
          if (r?.status === "ready" || r?.overallScore !== undefined) {
            clearInterval(reportPollInterval);
            dispatch({ type: "SET_REPORT", payload: r });
            dispatch({ type: "SET_REPORT_SESSION_ID", payload: sid });
            dispatch({ type: "SET_STATE", payload: "report_ready" });
          } else if (r?.status === "failed") {
            clearInterval(reportPollInterval);
            dispatch({ type: "SET_ERROR", payload: {
              code: "REPORT_GENERATION_FAILED",
              message: "Report generation failed. Your session data is saved — please try again."
            }});
          }
          // status === "generating" → keep polling
        } catch { /* keep polling */ }
      }, 3000);
    }

    try {
      const reportResult = await generateReport(sessionId);

      if (reportResult?.status === "ready" || reportResult?.overallScore !== undefined) {
        dispatch({ type: "SET_REPORT", payload: reportResult });
        dispatch({ type: "SET_REPORT_SESSION_ID", payload: sessionId });
        dispatch({ type: "SET_STATE", payload: "report_ready" });
      } else {
        // Poll for report completion
        startReportPolling(sessionId);
      }
    } catch (err) {
      if (err.code === "REPORT_GENERATION_LEASE_LOST" || err.code === "REPORT_GENERATING") {
        startReportPolling(sessionId);
        return;
      }
      // Report generation failed — do NOT set report_ready. The session data is
      // preserved on the backend; the user can retry from the error state.
      dispatch({ type: "SET_ERROR", payload: {
        code: "REPORT_GENERATION_FAILED",
        message: "We couldn't generate your report. Your session data is saved — please try again."
      }});
    }
  }

  // ── Reconcile and recover from error ─────────────────────────────────────
  // Backend-verified recovery: queries getCurrentQuestion to determine where
  // the user actually is, then transitions to the correct state without
  // clearing any state prematurely. Replaces clearError for the ErrorState path.
  const reconcileAndRecover = useCallback(async () => {
    const { session } = state;
    if (!session?.id) {
      dispatch({ type: "SET_STATE", payload: "setup" });
      return;
    }
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const question = await getCurrentQuestion(session.id);

      if (question) {
        if (question.pendingAttempt?.id) {
          // Unresolved question with a retryable failed attempt
          dispatch({ type: "SET_QUESTION", payload: question });
          dispatch({ type: "SET_ANSWER_RESULT", payload: null });
          dispatch({ type: "SET_EXPLANATION", payload: null });
          dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
          dispatch({ type: "SET_CHECKPOINT_STATE", payload: null });
          dispatch({ type: "SET_CHECKPOINT_ERROR", payload: null }); // clears all
          dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: question.pendingAttempt.id });
          dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: question.pendingAttempt.transcriptText || null });
          dispatch({ type: "SET_ERROR", payload: { code: "EVALUATION_FAILED",
            message: "We couldn't evaluate your answer. Please try again." } });
        } else {
          // No pending attempt — fresh recording
          // (covers both: fresh unanswered Q and normal-retries-exhausted Q)
          dispatch({ type: "SET_QUESTION", payload: question });
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
        // Current question is "answered" — advance.
        // Call getNextAction FIRST. Only clear state after a valid result is confirmed.
        let result;
        try {
          result = await getNextAction(session.id);
        } catch {
          // getNextAction failed — preserve all existing state
          dispatch({ type: "SET_ERROR", payload: { code: "RECONCILIATION_FAILED",
            message: "We couldn't verify your progress. Please try again." } });
          return;
        }

        // Validate the response before clearing any state
        const isValidResult =
          (result.action === "question" && result.question != null) ||
          (result.action === "complete") ||
          (result.action === "checkpoint" && Array.isArray(result.unresolvedQuestions));

        if (!isValidResult) {
          dispatch({ type: "SET_ERROR", payload: { code: "RECONCILIATION_FAILED",
            message: "We couldn't verify your progress. Please try again." } });
          return;
        }

        // getNextAction succeeded and response is valid — now perform destination-specific cleanup
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
          await triggerReportGeneration(session.id);
        } else if (result.action === "checkpoint") {
          dispatch({ type: "SET_ANSWER_RESULT", payload: null });
          dispatch({ type: "SET_EXPLANATION", payload: null });
          dispatch({ type: "SET_EXPLANATION_ERROR", payload: null });
          dispatch({ type: "SET_PENDING_ATTEMPT_ID", payload: null });
          dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
          dispatch({ type: "SET_ERROR", payload: null });
          // Do NOT clear checkpointError — per-question errors survive re-entry
          dispatch({ type: "SET_CHECKPOINT_STATE",
            payload: { unresolvedQuestions: result.unresolvedQuestions } });
          dispatch({ type: "SET_STATE", payload: "checkpoint" });
        }
      }
    } catch {
      // getCurrentQuestion threw — preserve ALL existing state
      dispatch({ type: "SET_ERROR", payload: { code: "RECONCILIATION_FAILED",
        message: "We couldn't verify your progress. Please try again." } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.session]);

  // ── Clear error / dismiss ─────────────────────────────────────────────────
  // Returns to the most sensible previous state given what's in context:
  //   - active session + current question → "asking" (resume where we were)
  //   - active session + no question      → "asking" (session active, await next Q)
  //   - no active session                 → "setup"
  // Previously this returned to "idle" when no question was set, which left the
  // user on a blank screen. It also incorrectly returned to "asking" after a
  // question-generation failure (Q3+), showing the stale Q2 instead of recovering.
  const clearError = useCallback(() => {
    const { session, question } = state;
    let prevUiState;
    if (session?.id && session.status === "active") {
      prevUiState = "asking"; // session is live — stay in it
    } else {
      prevUiState = "setup";  // no active session — go back to setup
    }
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_FAILED_TRANSCRIPT", payload: null });
    dispatch({ type: "SET_STATE", payload: prevUiState });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.session, state.question]);

  // ── Reset to idle ─────────────────────────────────────────────────────────
  const resetInterview = useCallback(() => {
    stopPolling();
    dispatch({ type: "RESET" });
  }, []);

  // ── Computed: is an interview actively in progress? ──────────────────────
  // Used by the navigation guard in InterviewPage to decide whether to prompt
  // before leaving. "True" for every state where the user is mid-session and
  // navigating away would silently orphan the backend session.
  const ONGOING_STATES = new Set([
    "starting", "asking", "listening", "processing",
    "showing_report", "retrying", "explaining", "completing", "checkpoint",
  ]);
  const isInterviewOngoing = ONGOING_STATES.has(state.uiState);

  const value = {
    ...state,
    isInterviewOngoing,
    // Actions
    restoreSession,
    goToSetup,
    beginInterview,
    submitVoiceAnswer,
    submitTextAnswerAction,
    continueToNext,
    retryCurrentQuestion,
    reevaluateFailedAttempt,
    requestConceptExplanation,
    continueFromExplanation,
    finishInterview,
    clearError,
    resetInterview,
    reconcileAndRecover,
    // Checkpoint actions
    skipQuestionAction,
    reevaluateAtCheckpoint,
    reAnswerAtCheckpoint,
    // Report retry
    retryReportGeneration: () => {
      const { session } = state;
      if (session?.id) triggerReportGeneration(session.id);
    },
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
}
