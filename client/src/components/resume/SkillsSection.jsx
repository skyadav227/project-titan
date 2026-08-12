/**
 * SkillsSection
 *
 * Grouped skill tags. No charts — just readable tags per spec.
 * Groups with no skills are omitted entirely.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

const GROUP_LABELS = {
  languages: "Languages",
  frontend:  "Frontend",
  backend:   "Backend",
  databases: "Databases",
  tools:     "Tools",
  other:     "Other",
};

function SkillTag({ name }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-white/65">
      {name}
    </span>
  );
}

export default function SkillsSection({ skills }) {
  if (!skills) return null;

  const groups = Object.entries(GROUP_LABELS).filter(
    ([key]) => Array.isArray(skills[key]) && skills[key].length > 0
  );

  if (groups.length === 0) return null;

  return (
    <DashboardCard enterIndex={3}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Skills</h3>
      <div className="flex flex-col gap-4">
        {groups.map(([key, label]) => (
          <div key={key}>
            <p className="text-xs text-white/35 mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
              {skills[key].map((skill) => (
                <SkillTag key={skill} name={skill} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
