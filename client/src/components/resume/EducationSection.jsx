/**
 * EducationSection
 * Clean, readable education entries. Omitted if empty.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

function EducationEntry({ entry }) {
  return (
    <div className="flex flex-col gap-0.5 pb-4 border-b border-white/[0.05] last:border-0 last:pb-0">
      <p className="text-sm font-medium text-white/85">
        {entry.degree}
        {entry.field ? ` — ${entry.field}` : ""}
      </p>
      <p className="text-xs text-white/45">{entry.institution}</p>
      {(entry.startDate || entry.endDate) && (
        <p className="text-xs text-white/30">
          {entry.startDate}
          {entry.endDate ? ` — ${entry.endDate}` : ""}
        </p>
      )}
      {entry.grade && (
        <p className="text-xs text-white/30">GPA / Grade: {entry.grade}</p>
      )}
    </div>
  );
}

export default function EducationSection({ education }) {
  if (!Array.isArray(education) || education.length === 0) return null;

  return (
    <DashboardCard enterIndex={5}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Education</h3>
      <div className="flex flex-col gap-4">
        {education.map((entry, i) => (
          <EducationEntry key={i} entry={entry} />
        ))}
      </div>
    </DashboardCard>
  );
}
