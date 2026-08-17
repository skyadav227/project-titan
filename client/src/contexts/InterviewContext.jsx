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
 *   report_ready    → master report available
 *   error           → recoverable error state
 *
 * The backend is the SINGLE source of truth for:
 *   - current question, question order, scores, evaluation, retry eligibility
 *   - completion, report availability, session status
 * This context only manages UI interaction state and caches backend data.
 *
 * On mount (or navigation to /interview/session/:id): restores from backend.
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
  retryQuestion,
  requestExplanation,
  continueAfterExplanation,
  endInterview,
  generateReport,
  getReport,
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
    case "RESET":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

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
  const restoreSession = useCallback(async (sessionId) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const session = await getInterview(sessionId);
      dispatch({ type: "SET_SESSION", payload: session });

      // Determine UI state from backend session status
      if (session.status === "completed") {
        const report = await getReport(sessionId).catch(() => null);
        dispatch({ type: "SET_REPORT", payload: report });
        dispatch({ type: "SET_STATE", payload: "report_ready" });
        return;
      }

      if (session.status === "active") {
        const { question } = await getCurrentQuestion(sessionId);
        if (question) {
          dispatch({ type: "SET_QUESTION", payload: question });
          dispatch({ type: "SET_STATE", payload: "asking" });
        } else {
          // Session active but no pending question — need to call next
          dispatch({ type: "SET_STATE", payload: "asking" });
        }
        return;
      }

      // created/starting → go back to setup
      dispatch({ type: "SET_STATE", payload: "idle" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
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
      dispatch({ type: "SET_STATE", payload: "asking" }); // allow retry
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
      dispatch({ type: "SET_STATE", payload: "asking" }); // allow retry
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

    try {
      const result = await getNextAction(session.id);

      if (result.action === "complete") {
        dispatch({ type: "SET_STATE", payload: "completing" });
        await triggerReportGeneration(session.id);
      } else if (result.action === "question") {
        dispatch({ type: "SET_QUESTION", payload: result.question });
        dispatch({ type: "SET_STATE", payload: "asking" });
      } else {
        // unexpected action — stay on report
        dispatch({ type: "SET_STATE", payload: "showing_report" });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
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

  // ── Request explanation ───────────────────────────────────────────────────
  const requestConceptExplanation = useCallback(async (topic) => {
    const { session, question } = state;
    if (!session?.id || !question?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await requestExplanation(session.id, { questionId: question.id, topic });
      dispatch({ type: "SET_EXPLANATION", payload: result });
      dispatch({ type: "SET_STATE", payload: "explaining" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
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
      dispatch({ type: "SET_ERROR", payload: err });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── End interview ──────────────────────────────────────────────────────────
  const finishInterview = useCallback(async (reason = "user_ended") => {
    const { session } = state;
    if (!session?.id) return;

    dispatch({ type: "SET_LOADING", payload: true });
    stopPolling();

    try {
      await endInterview(session.id, reason);
      dispatch({ type: "SET_STATE", payload: "completing" });
      await triggerReportGeneration(session.id);
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state]);

  // ── Generate + poll report ────────────────────────────────────────────────
  async function triggerReportGeneration(sessionId) {
    try {
      const reportResult = await generateReport(sessionId);

      if (reportResult?.status === "ready" || reportResult?.overallScore !== undefined) {
        dispatch({ type: "SET_REPORT", payload: reportResult });
        dispatch({ type: "SET_STATE", payload: "report_ready" });
      } else {
        // Poll for report completion
        let attempts = 0;
        const reportPollInterval = setInterval(async () => {
          attempts++;
          if (attempts > 15) {
            clearInterval(reportPollInterval);
            dispatch({ type: "SET_ERROR", payload: { code: "REPORT_GENERATION_FAILED", message: "Report is taking longer than expected." } });
            return;
          }
          try {
            const r = await getReport(sessionId);
            if (r?.status === "ready" || r?.overallScore !== undefined) {
              clearInterval(reportPollInterval);
              dispatch({ type: "SET_REPORT", payload: r });
              dispatch({ type: "SET_STATE", payload: "report_ready" });
            }
          } catch { /* keep polling */ }
        }, 3000);
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: { code: "REPORT_GENERATION_FAILED", message: "We couldn't generate your report. Your session data is saved." } });
      dispatch({ type: "SET_STATE", payload: "report_ready" }); // show what we have
    }
  }

  // ── Clear error / dismiss ─────────────────────────────────────────────────
  const clearError = useCallback(() => {
    const prevUiState = state.question ? "asking" : "idle";
    dispatch({ type: "SET_ERROR", payload: null });
    dispatch({ type: "SET_STATE", payload: prevUiState });
  }, [state.question]);

  // ── Reset to idle ─────────────────────────────────────────────────────────
  const resetInterview = useCallback(() => {
    stopPolling();
    dispatch({ type: "RESET" });
  }, []);

  const value = {
    ...state,
    // Actions
    restoreSession,
    goToSetup,
    beginInterview,
    submitVoiceAnswer,
    submitTextAnswerAction,
    continueToNext,
    retryCurrentQuestion,
    requestConceptExplanation,
    continueFromExplanation,
    finishInterview,
    clearError,
    resetInterview,
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
