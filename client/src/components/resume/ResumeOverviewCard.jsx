/**
 * ResumeOverviewCard
 *
 * Displays filename, file type, size, status, and version metadata.
 * Provides Replace and Delete actions.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";
import { useResume } from "../../contexts/ResumeContext";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ResumeOverviewCard({ onDeleteClick }) {
  const { activeResume, initiateReplacement } = useResume();
  if (!activeResume) return null;

  const ext = (activeResume.fileType || "").toUpperCase();

  return (
    <DashboardCard enterIndex={1}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* File icon */}
        <div className="flex-shrink-0 w-12 h-14 rounded-xl border border-white/[0.08] bg-white/[0.04] flex flex-col items-center justify-center gap-0.5" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="text-[9px] font-bold text-white/30">{ext}</span>
        </div>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-1">Active Resume</p>
              <p className="text-sm font-medium text-white/90 truncate max-w-[260px]" title={activeResume.fileName}>
                {activeResume.fileName}
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                {ext} · {formatBytes(activeResume.fileSize)}
                {activeResume.version && <> · Version {activeResume.version}</>}
              </p>
              {activeResume.updatedAt && (
                <p className="mt-0.5 text-xs text-white/30">
                  Updated {formatDate(activeResume.updatedAt)}
                </p>
              )}
            </div>

            {/* Status badge */}
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/60 border border-white/[0.08] rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-subtle" aria-hidden="true"/>
              Active
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Button variant="secondary" size="sm" onClick={initiateReplacement}>
              Replace Resume
            </Button>
            <button
              className="text-xs text-white/25 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 rounded"
              onClick={onDeleteClick}
              aria-label="Delete this resume"
            >
              Delete Resume
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
