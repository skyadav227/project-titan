/**
 * ProjectsSection
 *
 * Projects receive visual emphasis — TITAN uses them for personalized questions.
 * Omitted when empty.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

function ProjectCard({ project }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/90">{project.name}</p>
          {project.description && (
            <p className="mt-1 text-xs text-white/45 leading-relaxed">{project.description}</p>
          )}
        </div>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs text-white/25 hover:text-white/60 transition-colors"
            aria-label={`Open ${project.name} project URL`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
      </div>

      {Array.isArray(project.highlights) && project.highlights.length > 0 && (
        <ul className="space-y-0.5">
          {project.highlights.map((h, i) => (
            <li key={i} className="text-xs text-white/40 flex gap-1.5">
              <span className="text-white/20 flex-shrink-0" aria-hidden="true">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {Array.isArray(project.technologies) && project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-white/35">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsSection({ projects }) {
  if (!Array.isArray(projects) || projects.length === 0) return null;

  return (
    <DashboardCard enterIndex={6}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Projects</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((p, i) => (
          <ProjectCard key={i} project={p} />
        ))}
      </div>
    </DashboardCard>
  );
}
