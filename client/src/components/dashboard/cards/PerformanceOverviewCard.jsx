/**
 * PerformanceOverviewCard
 *
 * Returning User only. Quick summary of performance across 4 dimensions.
 *
 * Per spec (Component Spec §4, UI Spec §12, PRD §9):
 *   - No decorative graphs
 *   - Prefer compact score cards
 *   - Numbers animate smoothly when loaded
 *   - Display as clean cards, avoid complicated graphs
 *
 * Milestone 5 additions:
 *   - ScoreBadge now counts up from 0 → score
 *   - AnimatedBar fills in from left with a spring curve
 *   - Card enters with staggered fadeInUp
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import ScoreBadge from "../ui/ScoreBadge";
import AnimatedBar from "../ui/AnimatedBar";
import EmptyState from "../ui/EmptyState";
import { IconReports } from "../ui/DashboardIcons";

// ─── Individual score card ────────────────────────────────────────────────────

function ScoreCard({ label, score, delta, isOverall = false, countDelay = 0 }) {
  const barColor =
    score >= 75 ? "bg-emerald-500/60"
    : score >= 60 ? "bg-white/40"
    : "bg-amber-500/60";

  return (
    <div
      className={`
        flex flex-col gap-3
        p-4 rounded-xl
        border border-white/[0.06]
        ${isOverall ? "bg-white/[0.05] col-span-2" : "bg-white/[0.02]"}
      `}
    >
      <span className="text-xs text-white/35 font-medium">{label}</span>

      <ScoreBadge
        score={score}
        delta={delta}
        size={isOverall ? "lg" : "md"}
        animated
        delay={countDelay}
      />

      <AnimatedBar
        value={score}
        colorClass={barColor}
        delay={countDelay + 100}
      />
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PerformanceOverviewCard() {
  const { data } = useDashboard();
  const { performance, stats } = data;

  // Guard: if no real data yet, show empty state
  if (!performance?.overall?.score && performance?.overall?.score !== 0) {
    return (
      <DashboardCard className="flex flex-col gap-5" enterIndex={3}>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <SectionLabel>Progress</SectionLabel>
            <h2 className="text-base font-semibold text-white">Performance Overview</h2>
          </div>
        </div>
        <EmptyState
          icon={<IconReports className="w-5 h-5" />}
          message="Complete interviews to see your performance breakdown here."
          ctaLabel="Start Interview"
          ctaRoute="/interview/setup"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="flex flex-col gap-5" enterIndex={3}>
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

      {/* Score grid — 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          label="Overall"
          score={performance.overall.score}
          delta={performance.overall.delta}
          isOverall
          countDelay={80}
        />
        <ScoreCard
          label="Communication"
          score={performance.communication?.score}
          delta={performance.communication?.delta}
          countDelay={180}
        />
        <ScoreCard
          label="Technical"
          score={performance.technical?.score}
          delta={performance.technical?.delta}
          countDelay={260}
        />
        <ScoreCard
          label="Clarity"
          score={performance.clarity?.score}
          delta={performance.clarity?.delta}
          countDelay={340}
        />
      </div>

      {/* Level progress — only shown when backend provides it */}
      {stats.level && stats.levelProgress !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">Level: {stats.level}</span>
            <span className="text-xs text-white/30 tabular-nums">
              {stats.levelProgress}% to next
            </span>
          </div>
          <AnimatedBar
            value={stats.levelProgress}
            colorClass="bg-white/30"
            delay={420}
          />
        </div>
      )}
    </DashboardCard>
  );
}
