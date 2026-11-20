/**
 * CheckpointScreen
 *
 * Final evaluation checkpoint — shown when uiState === 'checkpoint'.
 * Displays all unresolved questions together and lets the user resolve
 * each one before the Master Report is generated.
 *
 * Actions per question:
 *   Re-evaluate     — re-run AI evaluation on the saved transcript.
 *   Re-answer       — fresh recording (only when canReAnswer is true).
 *   Skip            — permanently skip the question (irreversible, with confirm).
 *
 * Reads everything from useInterview(). No props.
 */
import { useState, useRef, useEffect } from "react";
import { useInterview } from "../../contexts/InterviewContext";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";

// ── Error code → human-readable label ────────────────────────────────────────
function errorLabel(code) {
  switch (code) {
    case "EVALUATION_FAILED":       return "AI evaluation failed";
    case "TRANSCRIPTION_FAILED":    return "Transcription failed";
    case "SPEECH_EMPTY_TRANSCRIPT": return "No speech detected";
    case "SPEECH_MALFORMED_RESPONSE": return "Transcription error";
    case "CHECKPOINT_EXHAUSTED":    return "Checkpoint attempts exhausted";
    case null:
    case undefined:
      return "Awaiting evaluation";
    default:
      return code.replace(/_/g, " ").toLowerCase();
  }
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin text-white/50 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Green check icon ──────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-400 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Resolved"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

// ── Single question row ───────────────────────────────────────────────────────
function QuestionRow({ question, isResolved, isLoading, onReevaluate, onReAnswer, onSkip, questionError }) {
  const [confirmSkip, setConfirmSkip] = useState(false);

  const {
    id,
    text,
    errorCode,
    hasTranscript,
    transcript,
    retriesUsed = 0,
    retriesRemaining = 0,
    canReevaluate,
    canReAnswer,
  } = question;

  const totalAttempts = retriesUsed + retriesRemaining;

  if (isResolved) {
    return (
      <DashboardCard className="opacity-60">
        <div className="flex items-center gap-3">
          <CheckIcon />
          <p className="text-sm text-white/70 flex-1 leading-relaxed">{text}</p>
          <span className="text-xs text-green-400/70 font-medium">Resolved</span>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard>
      {/* Question text */}
      <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-4">{text}</p>

      {/* Saved transcript */}
      {hasTranscript && transcript && (
        <div className="mb-4">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-1">
            Your answer (saved transcript)
          </p>
          <textarea
            readOnly
            value={transcript}
            rows={3}
            className="
              w-full max-h-32 overflow-y-auto
              bg-white/[0.03] border border-white/[0.08] rounded-lg
              px-3 py-2 text-sm text-white/60 resize-none
              focus:outline-none
            "
            aria-label="Saved transcript"
          />
        </div>
      )}

      {/* Status badge + retry counter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span
          className={`
            inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
            ${errorCode
              ? "border-red-500/20 text-red-400/80 bg-red-500/5"
              : "border-white/[0.08] text-white/40"}
          `}
        >
          {errorCode && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 flex-shrink-0" aria-hidden="true" />
          )}
          {errorLabel(errorCode)}
        </span>

        {retriesUsed > 0 && (
          <span className="text-xs text-white/30">
            {retriesUsed} of {totalAttempts} checkpoint attempt{totalAttempts !== 1 ? "s" : ""} used
          </span>
        )}

        {isLoading && <Spinner />}
      </div>

      {/* Action buttons */}
      {confirmSkip ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/50">Confirm skip — this cannot be undone</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setConfirmSkip(false); onSkip(id); }}
            disabled={isLoading}
          >
            Yes, skip
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmSkip(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {canReevaluate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReevaluate(question.attemptId)}
              disabled={isLoading}
              isLoading={isLoading}
            >
              Re-evaluate
            </Button>
          )}
          {canReAnswer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReAnswer(id)}
              disabled={isLoading}
            >
              Re-answer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmSkip(true)}
            disabled={isLoading}
          >
            Skip permanently
          </Button>
        </div>
      )}
      {questionError && (
        <p className="mt-2 text-xs text-red-400/70">
          {questionError.message || "Something went wrong. Please try again."}
        </p>
      )}
    </DashboardCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CheckpointScreen() {
  const {
    checkpointState,
    checkpointError,
    skipQuestionAction,
    reevaluateAtCheckpoint,
    reAnswerAtCheckpoint,
  } = useInterview();

  // Track per-question loading state (Map<questionId, boolean>)
  const [loadingMap, setLoadingMap] = useState(new Map());

  // Capture the initial set of question IDs on first render
  const initialIdsRef = useRef(null);

  const unresolvedQuestions = checkpointState?.unresolvedQuestions ?? [];

  // Capture initial IDs the first time we have data
  useEffect(() => {
    if (initialIdsRef.current === null && unresolvedQuestions.length > 0) {
      initialIdsRef.current = new Set(unresolvedQuestions.map((q) => q.id));
    }
  }, [unresolvedQuestions]);

  const initialIds = initialIdsRef.current ?? new Set(unresolvedQuestions.map((q) => q.id));
  const currentIds = new Set(unresolvedQuestions.map((q) => q.id));

  // Questions that were present initially but are no longer in unresolved list
  const resolvedIds = new Set([...initialIds].filter((id) => !currentIds.has(id)));

  // Build display list: current unresolved + already-resolved (from initialIds)
  const resolvedQuestions = [...resolvedIds].map((id) => {
    // We only have the ID for resolved questions — render a minimal resolved row
    return { id, text: "Question resolved", isResolvedPlaceholder: true };
  });

  const totalCount = initialIds.size;
  const resolvedCount = resolvedIds.size;

  function setQuestionLoading(questionId, loading) {
    setLoadingMap((prev) => {
      const next = new Map(prev);
      if (loading) {
        next.set(questionId, true);
      } else {
        next.delete(questionId);
      }
      return next;
    });
  }

  async function handleReevaluate(attemptId, questionId) {
    setQuestionLoading(questionId, true);
    try {
      await reevaluateAtCheckpoint(questionId, attemptId);  // both forwarded
    } finally {
      setQuestionLoading(questionId, false);
    }
  }

  async function handleReAnswer(questionId) {
    setQuestionLoading(questionId, true);
    try {
      await reAnswerAtCheckpoint(questionId);
    } finally {
      setQuestionLoading(questionId, false);
    }
  }

  async function handleSkip(questionId) {
    setQuestionLoading(questionId, true);
    try {
      await skipQuestionAction(questionId);
    } finally {
      setQuestionLoading(questionId, false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <DashboardCard className="dash-card-enter">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white/90 mb-1">Final Review</h2>
            <p className="text-sm text-white/40">
              Resolve each question before we generate your report.
            </p>
          </div>
          {totalCount > 0 && (
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-semibold text-white/80">
                {resolvedCount}
                <span className="text-base text-white/30 font-normal"> / {totalCount}</span>
              </p>
              <p className="text-xs text-white/30 mt-0.5">resolved</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mt-4 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-white/20 transition-all duration-500"
              style={{ width: `${Math.round((resolvedCount / totalCount) * 100)}%` }}
              role="progressbar"
              aria-valuenow={resolvedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${resolvedCount} of ${totalCount} questions resolved`}
            />
          </div>
        )}
      </DashboardCard>

      {/* Resolved questions (kept visible) */}
      {resolvedQuestions.map((q) => (
        <QuestionRow
          key={q.id}
          question={q}
          isResolved={true}
          isLoading={false}
          onReevaluate={() => {}}
          onReAnswer={() => {}}
          onSkip={() => {}}
        />
      ))}

      {/* Unresolved questions */}
      {unresolvedQuestions.map((question) => (
        <QuestionRow
          key={question.id}
          question={question}
          isResolved={false}
          isLoading={loadingMap.get(question.id) === true}
          onReevaluate={(attemptId) => handleReevaluate(attemptId, question.id)}
          onReAnswer={handleReAnswer}
          onSkip={handleSkip}
          questionError={checkpointError?.[question.id] || null}
        />
      ))}

      {/* Empty state — all resolved (context will transition away, but show briefly) */}
      {unresolvedQuestions.length === 0 && resolvedCount > 0 && (
        <DashboardCard className="flex flex-col items-center gap-4 py-10 text-center dash-card-enter">
          <div className="w-12 h-12 rounded-full border border-green-500/20 bg-green-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">All questions resolved</p>
            <p className="mt-1 text-xs text-white/35">Generating your performance report...</p>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
