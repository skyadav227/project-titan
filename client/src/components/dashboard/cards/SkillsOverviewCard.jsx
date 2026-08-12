/**
 * SkillsOverviewCard
 *
 * Returning User only. Highlights strengths and improvement areas.
 *
 * Per spec (Component Spec §6, UI Spec §14):
 *   Displays: Strong Skills, Needs Improvement, Recommended Topics
 *   Rules:
 *     - Easy to scan
 *     - Avoid large charts
 *     - Tags preferred
 *     - Simple progress indicators are fine
 *     - Information understandable within a few seconds
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import { IconReports } from "../ui/DashboardIcons";

// ─── Skill row with a compact progress bar ────────────────────────────────────

function SkillRow({ name, level, variant }) {
  const barColor =
    variant === "strong"
      ? "bg-white/50"
      : "bg-amber-400/50";

  const labelColor =
    variant === "strong"
      ? "text-white/65"
      : "text-amber-400/80";

  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="flex-1 text-sm text-white/60 min-w-0 truncate">{name}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${level}%` }}
          />
        </div>
        <span className={`text-xs tabular-nums font-medium w-8 text-right ${labelColor}`}>
          {level}
        </span>
      </div>
    </li>
  );
}

// ─── Recommended topic tag ────────────────────────────────────────────────────

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
      <DashboardCard>
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
    <DashboardCard className="flex flex-col gap-5">
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
          {skills.strong.map((s) => (
            <SkillRow key={s.name} name={s.name} level={s.level} variant="strong" />
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* Needs Improvement */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">
          Needs work
        </p>
        <ul className="flex flex-col" role="list" aria-label="Skills needing improvement">
          {skills.improve.map((s) => (
            <SkillRow key={s.name} name={s.name} level={s.level} variant="improve" />
          ))}
        </ul>
      </div>

      {/* Divider */}
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
