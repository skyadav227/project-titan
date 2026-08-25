/**
 * InterviewSession
 *
 * The primary live interview experience.
 * Renders the correct sub-component for each interview UI state.
 *
 * Per interview-ui-spec.md §11–21, interview-wireframe.md §23–45.
 *
 * States handled here:
 *   starting       → preparing screen
 *   asking         → question + VoiceRecorder (idle)
 *   listening      → (handled inside VoiceRecorder)
 *   retrying       → same question with retry context
 *   processing     → uploading/analyzing indicator
 *   showing_report → per-question feedback
 *   explaining     → explanation panel
 *   completing     → generating report
 *   error          → recoverable error state
 *
 * This component does NOT contain business logic — it delegates everything
 * to InterviewContext and sub-components.
 */
import { useCallback, useRef, useState } from "react";
import { useInterview } from "../../contexts/InterviewContext";
import VoiceRecorder    from "./VoiceRecorder";
import AnswerReport     from "./AnswerReport";
import ExplanationPanel from "./ExplanationPanel";
import DashboardCard    from "../dashboard/ui/DashboardCard";
import Button           from "../ui/Button";

// ── Idempotency key per answer (prevents duplicate submissions) ───────────────
function useIdempotencyKey() {
  const keyRef = useRef(null);

  const getKey = useCallback(() => {
    if (!keyRef.current) keyRef.current = `answer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return keyRef.current;
  }, []);

  const resetKey = useCallback(() => { keyRef.current = null; }, []);

  return { getKey, resetKey };
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ questionsCompleted, questionLimit, questionNumber }) {
  if (!questionLimit) return null;
  const pct = Math.min(100, Math.round((questionsCompleted / questionLimit) * 100));
  // Use the authoritative question number from the backend DTO when available.
  // questionNumber is set by questionToDto() and is correct for every question
  // including Q2, Q3 etc. Falls back to questionsCompleted+1 if absent.
  const displayNumber = questionNumber ?? (questionsCompleted || 0) + 1;
  return (
    <div className="flex items-center gap-3 text-xs text-white/30">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-white/20 dash-bar-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Interview progress ${pct}%`}
        />
      </div>
      <span>Question {displayNumber}</span>
    </div>
  );
}

// ── Processing state ──────────────────────────────────────────────────────────
function ProcessingState() {
  return (
    <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center dash-card-enter">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-white/10 animate-[spin_2s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border-t border-white/30 animate-[spin_1.2s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/30 animate-pulse-subtle" />
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p className="text-sm font-medium text-white/70">Analyzing your answer...</p>
        <p className="mt-1 text-xs text-white/30">Evaluating technical accuracy, communication, and more.</p>
      </div>
    </DashboardCard>
  );
}

// ── Starting/preparing state ──────────────────────────────────────────────────
function PreparingState() {
  return (
    <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center dash-card-enter">
      <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
        <svg className="w-5 h-5 text-white/30 animate-[spin_1.5s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <div aria-live="polite">
        <p className="text-sm font-medium text-white/70">Preparing your interview...</p>
        <p className="mt-1 text-xs text-white/30">Building your context and generating the first question.</p>
      </div>
    </DashboardCard>
  );
}

// ── Completing state ──────────────────────────────────────────────────────────
function CompletingState() {
  return (
    <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center dash-card-enter">
      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-white/30 animate-[spin_1.5s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <div aria-live="polite">
        <p className="text-sm font-medium text-white/70">Interview complete</p>
        <p className="mt-1 text-xs text-white/30">Generating your performance report...</p>
      </div>
    </DashboardCard>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ error, onDismiss }) {
  return (
    <DashboardCard className="flex flex-col items-center gap-5 py-10 text-center dash-card-enter">
      <div className="w-12 h-12 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center" aria-hidden="true">
        <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-white/80">
          {error?.message || "Something went wrong."}
        </p>
        <p className="mt-1 text-xs text-white/35">Your progress is preserved.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onDismiss}>Try Again</Button>
    </DashboardCard>
  );
}

// ── Question display ──────────────────────────────────────────────────────────
function QuestionDisplay({ question, isRetry, retryInfo }) {
  return (
    <div className="mb-6 dash-card-enter">
      <div className="flex items-center gap-2 mb-3">
        {isRetry && (
          <span className="badge-pill text-xs">
            Improvement attempt {question?.attemptNumber || 2}
            {retryInfo?.retriesRemaining > 0 && ` · ${retryInfo.retriesRemaining} left`}
          </span>
        )}
      </div>
      <DashboardCard>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
            <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/30 uppercase tracking-wider">
                {question?.topic || question?.category || "Interview Question"}
              </span>
              {question?.difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  question.difficulty === "hard"   ? "border-red-500/20 text-red-400/70" :
                  question.difficulty === "medium" ? "border-yellow-500/20 text-yellow-400/60" :
                  "border-green-500/20 text-green-400/60"
                }`}>
                  {question.difficulty}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed" id="question-text">
              {question?.text || "Loading question..."}
            </p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

// ── Text answer panel (dev / integration-test path) ──────────────────────────
// Shown below the VoiceRecorder when microphone STT is not configured.
// Uses the text directly as the transcript and routes through AI evaluation.
// Clearly labelled so it is never mistaken for the production voice interface.
function TextAnswerPanel({ onSubmit, isLoading, disabled }) {
  const [text, setText] = useState("");
  const MIN_CHARS = 10;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN_CHARS) return;
    onSubmit(trimmed);
    setText("");
  }

  const remaining = MIN_CHARS - text.trim().length;
  const isValid   = text.trim().length >= MIN_CHARS;

  return (
    <DashboardCard className="mt-3 dash-card-enter">
      {/* Dev-mode label — clearly distinguishes this from the production voice UI */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-400/60 border border-yellow-500/20 rounded px-2 py-0.5">
          Text mode
        </span>
        <span className="text-xs text-white/25">
          Type your answer (no microphone required)
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <textarea
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isLoading || disabled}
          placeholder="Type your answer here…"
          aria-label="Type your interview answer"
          className="
            w-full bg-white/[0.03] border border-white/[0.08] rounded-lg
            px-3 py-2.5 text-sm text-white/80 placeholder-white/20
            resize-none focus:outline-none focus:border-white/20
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${isValid ? "text-white/25" : "text-white/35"}`}>
            {isValid
              ? `${text.trim().length} characters`
              : `${remaining} more character${remaining === 1 ? "" : "s"} needed`}
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!isValid || isLoading || disabled}
            isLoading={isLoading}
          >
            Submit Answer
          </Button>
        </div>
      </form>
    </DashboardCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewSession() {
  const {
    uiState,
    session,
    question,
    answerResult,
    explanation,
    retryInfo,
    error,
    isLoading,
    submitVoiceAnswer,
    submitTextAnswerAction,
    continueToNext,
    retryCurrentQuestion,
    requestConceptExplanation,
    continueFromExplanation,
    finishInterview,
    clearError,
  } = useInterview();

  const { getKey, resetKey } = useIdempotencyKey();

  const handleRecordingComplete = useCallback(({ audioBlob, durationMs }) => {
    const key = getKey();
    submitVoiceAnswer({ audioBlob, durationMs, idempotencyKey: key });
    setTimeout(resetKey, 5000);
  }, [submitVoiceAnswer, getKey, resetKey]);

  const handleTextSubmit = useCallback((text) => {
    const key = getKey();
    submitTextAnswerAction({ text, idempotencyKey: key });
    setTimeout(resetKey, 5000);
  }, [submitTextAnswerAction, getKey, resetKey]);

  // ── Error state ────────────────────────────────────────────────────────────
  if (uiState === "error") {
    return (
      <div className="max-w-xl mx-auto">
        <ErrorState error={error} onDismiss={clearError} />
      </div>
    );
  }

  // ── Preparing / starting ───────────────────────────────────────────────────
  if (uiState === "starting") {
    return <div className="max-w-xl mx-auto"><PreparingState /></div>;
  }

  // ── Completing + generating report ────────────────────────────────────────
  if (uiState === "completing") {
    return <div className="max-w-xl mx-auto"><CompletingState /></div>;
  }

  // ── Processing answer ─────────────────────────────────────────────────────
  if (uiState === "processing") {
    return <div className="max-w-xl mx-auto"><ProcessingState /></div>;
  }

  // ── Explanation ───────────────────────────────────────────────────────────
  if (uiState === "explaining") {
    return (
      <div className="max-w-2xl mx-auto">
        <ExplanationPanel
          explanation={explanation}
          onContinue={continueFromExplanation}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // ── Per-question report ───────────────────────────────────────────────────
  if (uiState === "showing_report") {
    return (
      <div className="max-w-2xl mx-auto">
        {session && (
          <div className="mb-4">
            <ProgressBar
              questionsCompleted={session.questionsCompleted}
              questionLimit={session.questionLimit}
              questionNumber={question?.number}
            />
          </div>
        )}
        <AnswerReport
          question={question}
          answerResult={answerResult}
          onContinue={continueToNext}
          onRetry={answerResult?.retry?.available ? retryCurrentQuestion : null}
          onExplain={answerResult?.explanation?.recommended ? () => {
            const topic = question?.topic || question?.category || "this concept";
            requestConceptExplanation(topic);
          } : null}
          onEnd={finishInterview}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // ── Asking / retrying (question + voice recorder) ─────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Session progress */}
      {session && (
        <div className="mb-5">
          <ProgressBar
            questionsCompleted={session.questionsCompleted}
            questionLimit={session.questionLimit}
            questionNumber={question?.number}
          />
        </div>
      )}

      {/* Question */}
      <QuestionDisplay
        question={question}
        isRetry={uiState === "retrying"}
        retryInfo={retryInfo}
      />

      {/* Voice recorder */}
      <DashboardCard className="flex flex-col items-center py-10 gap-0">
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          disabled={isLoading || !question?.id}
        />
      </DashboardCard>

      {/* Text answer panel — dev/integration-test path (no STT required) */}
      <TextAnswerPanel
        onSubmit={handleTextSubmit}
        isLoading={isLoading}
        disabled={!question?.id}
      />

      {/* End interview */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => finishInterview("user_ended")}
          disabled={isLoading}
          className="text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          End interview
        </button>
      </div>
    </div>
  );
}
