/**
 * SkillsOverviewCard
 *
 * Returning User only. Highlights strengths and improvement areas.
 *
 * Per spec (Component Spec §6, UI Spec §14):
 *   - Easy to scan
 *   - Avoid large charts
 *   - Tags preferred
 *   - Simple progress indicators
 *
 * Milestone 5 additions:
 *   - AnimatedBar fills in for each skill row
 *   - Card enters with staggered fadeInUp
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import AnimatedBar from "../ui/AnimatedBar";
import { IconReports } from "../ui/DashboardIcons";

// ─── Skill row ────────────────────────────────────────────────────────────────

function SkillRow({ name, level, variant, barDelay }) {
  const barColor  = variant === "strong" ? "bg-white/50"    : "bg-amber-400/50";
  const textColor = variant === "strong" ? "text-white/65"  : "text-amber-400/80";

  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="flex-1 text-sm text-white/60 min-w-0 truncate">{name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <AnimatedBar
          value={level}
          colorClass={barColor}
          className="w-20"
          height="h-1.5"
          delay={barDelay}
        />
        <span className={`text-xs tabular-nums font-medium w-8 text-right ${textColor}`}>
          {level}
        </span>
      </div>
    </li>
  );
}

// ─── Topic tag ────────────────────────────────────────────────────────────────

function TopicTag({ label }) {
  return (
    <span
      className="
        inline-flex items-center
        px-3 py-1.5 rounded-lg
        border border-white/[0.08] bg-white/[0.03]
        text-xs text-white/50
        whitespace-nowrap
      "
    >
      {label}
    </span>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function SkillsOverviewCard() {
  const { data } = useDashboard();
  const skills = data.skills;

  if (!skills) {
    return (
      <DashboardCard enterIndex={4}>
        <EmptyState
          icon={<IconReports className="w-5 h-5" />}
          message="Complete interviews to discover your skill profile and improvement areas."
          ctaLabel="Start Interview"
          ctaRoute="/interview"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="flex flex-col gap-5" enterIndex={4}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Skills</SectionLabel>
        <h2 className="text-base font-semibold text-white">Skills Overview</h2>
      </div>

      {/* Strong Skills */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">
          Strengths
        </p>
        <ul className="flex flex-col" role="list" aria-label="Strong skills">
          {skills.strong.map((s, i) => (
            <SkillRow
              key={s.name}
              name={s.name}
              level={s.level}
              variant="strong"
              barDelay={120 + i * 60}
            />
          ))}
        </ul>
      </div>

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* Needs Improvement */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">
          Needs work
        </p>
        <ul className="flex flex-col" role="list" aria-label="Skills needing improvement">
          {skills.improve.map((s, i) => (
            <SkillRow
              key={s.name}
              name={s.name}
              level={s.level}
              variant="improve"
              barDelay={360 + i * 60}
            />
          ))}
        </ul>
      </div>

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* Recommended topics */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
          Recommended topics
        </p>
        <div className="flex flex-wrap gap-2 min-w-0" role="list" aria-label="Recommended topics">
          {skills.recommended.map((topic) => (
            <TopicTag key={topic} label={topic} />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
