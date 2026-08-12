/**
 * PerformanceOverviewCard
 *
 * Returning User only. Quick summary of performance across 4 dimensions.
 *
 * Per spec (Component Spec §4, UI Spec §12, PRD §9):
 *   Displays: Overall Score, Communication, Technical, Confidence
 *   Rules:
 *     - No decorative graphs
 *     - Prefer compact score cards
 *     - Animated numbers (handled in Milestone 5)
 *     - Display as clean cards, avoid complicated graphs
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import ScoreBadge from "../ui/ScoreBadge";
import { IconReports } from "../ui/DashboardIcons";

// ─── Individual score card ────────────────────────────────────────────────────

function ScoreCard({ label, score, delta, isOverall = false }) {
  // Score bar colour
  const barColor =
    score >= 75
      ? "bg-emerald-500/60"
      : score >= 60
      ? "bg-white/40"
      : "bg-amber-500/60";

  return (
    <div
      className={`
        flex flex-col gap-3
        p-4 rounded-xl
        border border-white/[0.06]
        ${isOverall
          ? "bg-white/[0.05] col-span-2"
          : "bg-white/[0.02]"
        }
      `}
    >
      <span className="text-xs text-white/35 font-medium">{label}</span>

      <ScoreBadge
        score={score}
        delta={delta}
        size={isOverall ? "lg" : "md"}
      />

      {/* Score bar */}
      <div
        className="h-1 rounded-full bg-white/[0.06] overflow-hidden"
        role="presentation"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PerformanceOverviewCard() {
  const { data } = useDashboard();
  const { performance, stats } = data;

  return (
    <DashboardCard className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <SectionLabel>Progress</SectionLabel>
          <h2 className="text-base font-semibold text-white">Performance Overview</h2>
        </div>
        <div
          className="
            flex items-center gap-1.5
            px-2.5 py-1 rounded-lg
            border border-white/[0.06] bg-white/[0.03]
            text-xs text-white/30
          "
          aria-label={`${stats.interviewsCompleted} interviews completed`}
        >
          <IconReports className="w-3.5 h-3.5" />
          <span className="tabular-nums">{stats.interviewsCompleted}</span>
        </div>
      </div>

      {/* Score grid — 2 columns always. Overall spans full width at mobile, half at sm+ */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          label="Overall"
          score={performance.overall.score}
          delta={performance.overall.delta}
          isOverall
        />
        <ScoreCard
          label="Communication"
          score={performance.communication.score}
          delta={performance.communication.delta}
        />
        <ScoreCard
          label="Technical"
          score={performance.technical.score}
          delta={performance.technical.delta}
        />
        <ScoreCard
          label="Confidence"
          score={performance.confidence.score}
          delta={performance.confidence.delta}
        />
      </div>

      {/* Level progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">Level: {stats.level}</span>
          <span className="text-xs text-white/30 tabular-nums">{stats.levelProgress}% to next</span>
        </div>
        <div
          className="h-1 rounded-full bg-white/[0.06] overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.levelProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level progress: ${stats.levelProgress}%`}
        >
          <div
            className="h-full rounded-full bg-white/30 transition-all duration-700"
            style={{ width: `${stats.levelProgress}%` }}
          />
        </div>
      </div>
    </DashboardCard>
  );
}
