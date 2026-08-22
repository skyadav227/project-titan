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
 * Note: skill level numbers are not available in V1 (backend returns level: null).
 * When level is null the card uses a tag-only layout, which matches the spec's
 * "Tags preferred" guidance and avoids rendering bogus numeric values.
 * The AnimatedBar + numeric layout is preserved for when real levels are added.
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import AnimatedBar from "../ui/AnimatedBar";
import { IconReports } from "../ui/DashboardIcons";

// ─── Skill row — shown when a numeric level value exists ──────────────────────

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

// ─── Skill tag — used when only the name is available (level === null) ─────────

function SkillTag({ name, variant }) {
  const color = variant === "strong"
    ? "border-white/[0.08] bg-white/[0.03] text-white/60"
    : "border-amber-500/20 bg-amber-500/[0.05] text-amber-400/80";
  return (
    <span
      className={`
        inline-flex items-center
        px-3 py-1.5 rounded-lg border
        text-xs whitespace-nowrap
        ${color}
      `}
    >
      {name}
    </span>
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

// ─── Skill list — selects row vs tag based on data availability ───────────────

function SkillList({ skills, variant, baseDelay }) {
  // If any item has a real numeric level, use the bar row layout
  const hasLevels = skills.some(s => typeof s.level === "number" && s.level !== null);

  if (hasLevels) {
    return (
      <ul className="flex flex-col" role="list" aria-label={variant === "strong" ? "Strong skills" : "Skills needing improvement"}>
        {skills.map((s, i) => (
          <SkillRow
            key={s.name}
            name={s.name}
            level={s.level}
            variant={variant}
            barDelay={baseDelay + i * 60}
          />
        ))}
      </ul>
    );
  }

  // Tag-only layout when level data is unavailable (V1 default)
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={variant === "strong" ? "Strong areas" : "Areas needing improvement"}>
      {skills.map(s => (
        <SkillTag key={s.name} name={s.name} variant={variant} />
      ))}
    </div>
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

      {/* Strengths */}
      {skills.strong.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
            Strengths
          </p>
          <SkillList skills={skills.strong} variant="strong" baseDelay={120} />
        </div>
      )}

      {skills.strong.length > 0 && skills.improve.length > 0 && (
        <div className="h-px bg-white/[0.05]" aria-hidden="true" />
      )}

      {/* Needs work */}
      {skills.improve.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
            Needs work
          </p>
          <SkillList skills={skills.improve} variant="improve" baseDelay={360} />
        </div>
      )}

      {/* Recommended topics */}
      {skills.recommended.length > 0 && (
        <>
          <div className="h-px bg-white/[0.05]" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
              Recommended topics
            </p>
            <div className="flex flex-wrap gap-2 min-w-0" role="list" aria-label="Recommended topics">
              {skills.recommended.map(topic => (
                <TopicTag key={topic} label={topic} />
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
}
