/**
 * ExperienceSection
 *
 * Timeline-style experience entries, chronological order.
 * If no experience exists, shows a compact "No professional experience listed"
 * which is intentional profile information, not an error.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

function ExperienceEntry({ entry }) {
  return (
    <div className="flex gap-3">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center pt-0.5">
        <div className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0 mt-0.5" aria-hidden="true"/>
        <div className="w-px flex-1 bg-white/[0.06] mt-1" aria-hidden="true"/>
      </div>

      <div className="pb-6 min-w-0">
        <p className="text-sm font-medium text-white/85">{entry.role}</p>
        <p className="text-xs text-white/45 mt-0.5">
          {entry.company}
          {entry.location ? ` · ${entry.location}` : ""}
        </p>
        {(entry.startDate || entry.endDate) && (
          <p className="text-xs text-white/30 mt-0.5">
            {entry.startDate}
            {entry.endDate ? ` — ${entry.endDate}` : " — Present"}
          </p>
        )}
        {Array.isArray(entry.description) && entry.description.length > 0 && (
          <ul className="mt-2 space-y-1">
            {entry.description.map((line, i) => (
              <li key={i} className="text-xs text-white/45 flex gap-1.5">
                <span className="text-white/20 flex-shrink-0" aria-hidden="true">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
        {Array.isArray(entry.technologies) && entry.technologies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.technologies.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-white/35">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExperienceSection({ experience }) {
  if (!Array.isArray(experience)) return null;

  return (
    <DashboardCard enterIndex={4}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Experience</h3>
      {experience.length === 0 ? (
        <p className="text-sm text-white/30 italic">No professional experience listed.</p>
      ) : (
        <div>
          {experience.map((entry, i) => (
            <ExperienceEntry key={i} entry={entry} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
