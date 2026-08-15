/**
 * AnswerReport
 *
 * Per-question performance feedback component.
 * Renders the full answer analysis returned by the backend.
 * Never fabricates scores or feedback — only renders what the backend provides.
 *
 * Per interview-ui-spec.md §22–32, interview-wireframe.md §29–36.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button        from "../ui/Button";

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, score }) {
  if (score === null || score === undefined) return null;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? "bg-green-500/50" : pct >= 50 ? "bg-yellow-500/50" : "bg-red-500/40";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} dash-bar-fill`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-xs font-mono text-white/50 w-8 text-right">{score}</span>
    </div>
  );
}

// ── Classification badge ──────────────────────────────────────────────────────
function ClassificationBadge({ classification }) {
  const map = {
    correct:           { label: "Correct",           cls: "border-green-500/30 text-green-400/80" },
    mostly_correct:    { label: "Mostly Correct",    cls: "border-green-500/20 text-green-400/60" },
    partially_correct: { label: "Partially Correct", cls: "border-yellow-500/25 text-yellow-400/70" },
    incorrect:         { label: "Needs Improvement", cls: "border-red-500/25 text-red-400/70" },
    insufficient:      { label: "Insufficient",      cls: "border-white/15 text-white/40" },
    off_topic:         { label: "Off Topic",         cls: "border-orange-500/25 text-orange-400/60" },
  };
  const cfg = map[classification] || { label: classification, cls: "border-white/15 text-white/40" };
  return (
    <span className={`inline-block text-xs px-3 py-1 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Retry comparison ──────────────────────────────────────────────────────────
function RetryComparison({ improvement }) {
  if (!improvement || improvement.improvement === null) return null;
  const delta = improvement.improvement;
  const improved = delta > 0;
  return (
    <DashboardCard className="mb-4 dash-card-enter">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Improvement</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-white/30">Previous</p>
          <p className="text-2xl font-semibold text-white/50">{improvement.previousScore ?? "—"}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className={`text-lg font-semibold ${improved ? "text-green-400" : delta < 0 ? "text-red-400" : "text-white/40"}`}>
            {improved ? "+" : ""}{delta}
          </div>
          <div className="w-full h-px bg-white/10 mt-1" />
        </div>
        <div className="text-center">
          <p className="text-xs text-white/30">This attempt</p>
          <p className="text-2xl font-semibold text-white">{improvement.currentScore ?? "—"}</p>
        </div>
      </div>
      {improvement.improvedAreas?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {improvement.improvedAreas.map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded border border-green-500/20 text-green-400/70">
              ↑ {a}
            </span>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnswerReport({
  question,
  answerResult,
  onContinue,
  onRetry,
  onExplain,
  onEnd,
  isLoading,
}) {
  const ev   = answerResult?.evaluation || null;
  const imp  = answerResult?.improvement || null;

  return (
    <div className="dash-card-enter" role="region" aria-label="Answer Feedback">

      {/* ── Improvement comparison (if retry) ────────────────────── */}
      <RetryComparison improvement={imp} />

      {/* ── Overall score ────────────────────────────────────────── */}
      <DashboardCard className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-1">Answer Review</p>
            {question && (
              <p className="text-sm text-white/50 line-clamp-2">{question.text}</p>
            )}
          </div>
          {ev?.classification && (
            <div className="flex-shrink-0">
              <ClassificationBadge classification={ev.classification} />
            </div>
          )}
        </div>

        {ev?.overallScore !== null && ev?.overallScore !== undefined && (
          <div className="mt-4">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-white">{ev.overallScore}</span>
              <span className="text-base text-white/30 mb-1">/100</span>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              <ScoreBar label="Technical"     score={ev.technicalAccuracy} />
              <ScoreBar label="Relevance"      score={ev.relevance} />
              <ScoreBar label="Communication"  score={ev.communication} />
              <ScoreBar label="Structure"      score={ev.structure} />
              <ScoreBar label="Completeness"   score={ev.completeness} />
            </div>
          </div>
        )}
      </DashboardCard>

      {/* ── Strengths ────────────────────────────────────────────── */}
      {ev?.strengths?.length > 0 && (
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">What went well</p>
          <ul className="space-y-2">
            {ev.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-green-400/70 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {/* ── Issues + missing points ───────────────────────────────── */}
      {((ev?.weaknesses?.length > 0) || (ev?.missingPoints?.length > 0)) && (
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">What could improve</p>

          {ev?.weaknesses?.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-white/60 mb-2 last:mb-0">
              <span className="text-yellow-400/70 mt-0.5 flex-shrink-0" aria-hidden="true">!</span>
              {w}
            </div>
          ))}

          {ev?.missingPoints?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-2">Missing points</p>
              {ev.missingPoints.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-white/50 mb-1.5 last:mb-0">
                  <span className="text-white/20 flex-shrink-0" aria-hidden="true">·</span>
                  {p}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {/* ── Technical feedback ───────────────────────────────────── */}
      {ev?.technicalFeedback?.correctness && (
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Technical Feedback</p>
          <p className="text-sm text-white/60">{ev.technicalFeedback.correctness}</p>

          {ev.technicalFeedback.improvedExplanation && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-1.5">Better approach</p>
              <p className="text-sm text-white/50 italic">{ev.technicalFeedback.improvedExplanation}</p>
            </div>
          )}

          {ev.technicalFeedback.misconceptions?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-2">Misconceptions to address</p>
              {ev.technicalFeedback.misconceptions.map((m, i) => (
                <p key={i} className="text-sm text-red-400/60 mb-1 last:mb-0">· {m}</p>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {/* ── Communication feedback ────────────────────────────────── */}
      {ev?.communicationFeedback?.observations?.length > 0 && (
        <DashboardCard className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Communication</p>

          {ev.speech && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3 text-xs text-white/40">
              {ev.speech.wordCount    !== null && <span>Words: {ev.speech.wordCount}</span>}
              {ev.speech.speakingRate !== null && <span>Pace: {ev.speech.speakingRate} wpm</span>}
              {ev.speech.fillerWordCount !== null && ev.speech.fillerWordCount > 0 && (
                <span>Filler words: {ev.speech.fillerWordCount}</span>
              )}
            </div>
          )}

          {ev.communicationFeedback.observations.map((obs, i) => (
            <p key={i} className="text-sm text-white/55 mb-2 last:mb-0">· {obs}</p>
          ))}

          {ev.communicationFeedback.suggestions?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              {ev.communicationFeedback.suggestions.map((s, i) => (
                <p key={i} className="text-sm text-white/40 mb-1.5 last:mb-0">→ {s}</p>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {/* ── Suggestions ──────────────────────────────────────────── */}
      {ev?.suggestions?.length > 0 && (
        <DashboardCard className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Suggestions</p>
          {ev.suggestions.map((s, i) => (
            <p key={i} className="text-sm text-white/50 mb-2 last:mb-0">→ {s}</p>
          ))}
        </DashboardCard>
      )}

      {/* ── Explain offer ─────────────────────────────────────────── */}
      {onExplain && (
        <DashboardCard className="mb-4 dash-card-enter">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/70">Want to understand this concept better?</p>
              <p className="text-xs text-white/35 mt-0.5">Get a concise explanation before continuing.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onExplain} disabled={isLoading}>
              Explain
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* ── Action buttons ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button
            variant="secondary"
            fullWidth
            onClick={onRetry}
            disabled={isLoading}
          >
            Try Again
          </Button>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={onContinue}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Continue
        </Button>
      </div>

      {/* End early */}
      {onEnd && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => onEnd("user_ended")}
            disabled={isLoading}
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            End interview
          </button>
        </div>
      )}
    </div>
  );
}
