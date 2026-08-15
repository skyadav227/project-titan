/**
 * MasterReport
 *
 * Final performance report component.
 * Renders all sections of the final report returned by the backend.
 * Only displays sections where backend data exists — never fabricates.
 *
 * Per interview-ui-spec.md §40–42, interview-wireframe.md §50–62.
 */
import { useNavigate } from "react-router-dom";
import DashboardCard   from "../dashboard/ui/DashboardCard";
import Button          from "../ui/Button";
import { useInterview } from "../../contexts/InterviewContext";

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  if (score === null || score === undefined) return null;
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="dash-bar-fill"
            style={{ "--target-width": `${pct}%` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-xs text-white/30">/100</span>
        </div>
      </div>
      <p className="text-xs text-white/40">Overall Score</p>
    </div>
  );
}

// ── Dimension bar ─────────────────────────────────────────────────────────────
function DimensionBar({ label, score }) {
  if (score === null || score === undefined) return null;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? "bg-green-500/40" : pct >= 50 ? "bg-yellow-500/40" : "bg-red-500/35";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} dash-bar-fill`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-white/50 w-8 text-right">{score}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MasterReport() {
  const { report, session, resetInterview } = useInterview();
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="max-w-xl mx-auto">
        <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center dash-card-enter">
          <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <svg className="w-5 h-5 text-white/30 animate-[spin_1.5s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div aria-live="polite">
            <p className="text-sm font-medium text-white/70">Generating your report...</p>
            <p className="mt-1 text-xs text-white/30">This may take a moment.</p>
          </div>
        </DashboardCard>
      </div>
    );
  }

  const dims      = report.performance || {};
  const speech    = report.speech     || {};
  const progress  = report.progress   || {};
  const breakdown = report.questionBreakdown || [];

  function handlePracticeAgain() {
    resetInterview();
    navigate("/interview/setup");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 dash-card-enter">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-white">Interview Complete</h1>
        {session && (
          <p className="text-sm text-white/35 mt-0.5">
            {session.role || session.interviewType} · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {/* ── Overall performance ──────────────────────────────── */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <ScoreRing score={report.overallScore} />
          <div className="flex-1 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Performance Breakdown</p>
            <DimensionBar label="Technical Accuracy" score={dims.technicalAccuracy} />
            <DimensionBar label="Communication"      score={dims.communication} />
            <DimensionBar label="Clarity"            score={dims.clarity} />
            <DimensionBar label="Structure"          score={dims.structure} />
            <DimensionBar label="Relevance"          score={dims.relevance} />
            <DimensionBar label="Problem Solving"    score={dims.problemSolving} />
          </div>
        </div>
      </DashboardCard>

      {/* ── Stats ───────────────────────────────────────────── */}
      {(progress.questionsAnswered || progress.questionsRetried) && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Session Stats</p>
          <div className="grid grid-cols-3 gap-4">
            {progress.questionsAnswered && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{progress.questionsAnswered}</p>
                <p className="text-xs text-white/30 mt-0.5">Questions</p>
              </div>
            )}
            {progress.questionsRetried >= 0 && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-white">{progress.questionsRetried}</p>
                <p className="text-xs text-white/30 mt-0.5">Retried</p>
              </div>
            )}
            {progress.improvedAttempts >= 0 && (
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-400">{progress.improvedAttempts}</p>
                <p className="text-xs text-white/30 mt-0.5">Improved</p>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {/* ── Speech summary ──────────────────────────────────── */}
      {(speech.averageSpeakingRate || speech.totalFillerWords) && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Delivery</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {speech.averageSpeakingRate && (
              <div>
                <p className="text-lg font-semibold text-white">{speech.averageSpeakingRate}</p>
                <p className="text-xs text-white/30">avg words/min</p>
              </div>
            )}
            {speech.totalFillerWords !== null && speech.totalFillerWords !== undefined && (
              <div>
                <p className="text-lg font-semibold text-white">{speech.totalFillerWords}</p>
                <p className="text-xs text-white/30">filler words</p>
              </div>
            )}
          </div>
        </DashboardCard>
      )}

      {/* ── Strengths ───────────────────────────────────────── */}
      {report.strengths?.length > 0 && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">What you did well</p>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-green-400/70 mt-0.5 flex-shrink-0" aria-hidden="true">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {/* ── Improvement areas ───────────────────────────────── */}
      {report.improvements?.length > 0 && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Top areas to improve</p>
          <ol className="space-y-2">
            {report.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                <span className="text-white/20 flex-shrink-0 w-4">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </DashboardCard>
      )}

      {/* ── Knowledge gaps ──────────────────────────────────── */}
      {report.knowledgeGaps?.length > 0 && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Knowledge Gaps</p>
          <div className="flex flex-wrap gap-2">
            {report.knowledgeGaps.map((g, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full border border-orange-500/20 text-orange-400/70">{g}</span>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* ── Recommended next steps ──────────────────────────── */}
      {report.recommendations?.length > 0 && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Recommended Next Steps</p>
          <ul className="space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                <span className="text-white/20 flex-shrink-0 mt-0.5">→</span>
                {r}
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {/* ── Question breakdown ──────────────────────────────── */}
      {breakdown.length > 0 && (
        <DashboardCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Question Breakdown</p>
          <div className="space-y-3">
            {breakdown.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white/30">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/55 truncate">{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {q.bestScore !== null && (
                      <span className="text-xs text-white/35">{q.bestScore}/100</span>
                    )}
                    {q.attempts > 1 && (
                      <span className="text-xs text-white/25">{q.attempts} attempts</span>
                    )}
                    {q.improved && (
                      <span className="text-xs text-green-400/60">↑ improved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="primary" fullWidth onClick={handlePracticeAgain}>
          Practice Again
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate("/history")}>
          View History
        </Button>
      </div>
    </div>
  );
}
