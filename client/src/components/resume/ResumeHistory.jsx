import { useState } from "react";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";
import { useResume } from "../../contexts/ResumeContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function FileTextIcon({ className }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isActive, deletedAt }) => {
  if (deletedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/35">
        Deleted
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
        Active
      </span>
    );
  }
  if (status === "processing" || status === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
        <SpinnerIcon className="animate-[spin_1.5s_linear_infinite]" />
        Processing
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400">
        <XCircleIcon />
        Failed
      </span>
    );
  }
  // ready, not active
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
      <CheckCircleIcon />
      Ready
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResumeHistory() {
  const { resumeHistory, historyLoading, activateResume, uiState } = useResume();
  const [activatingId, setActivatingId] = useState(null);

  if (!historyLoading && resumeHistory.length <= 1) return null;

  const anyActivating = activatingId !== null;
  const pendingReview = uiState === "ready_for_review";

  const handleActivate = async (id) => {
    setActivatingId(id);
    try {
      await activateResume(id);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <DashboardCard className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Resume History</h2>
        <span className="text-xs text-white/40">
          {resumeHistory.length} version{resumeHistory.length !== 1 ? "s" : ""}
        </span>
      </div>

      {historyLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06]" role="list">
          {resumeHistory.map((version) => {
            const isActivating = activatingId === version.id;
            const canActivate =
              !version.isActive &&
              version.status === "ready" &&
              !version.deletedAt &&
              !anyActivating &&
              !pendingReview;

            return (
              <li
                key={version.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* File icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/60">
                  <FileTextIcon />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">
                    {version.fileName ?? "Resume"}
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">
                    Version {version.version} &middot; {formatDate(version.createdAt)} &middot; {formatBytes(version.fileSize)}
                  </p>
                </div>

                {/* Status badge */}
                <StatusBadge status={version.status} isActive={version.isActive} deletedAt={version.deletedAt} />

                {/* Activate button */}
                {!version.isActive && version.status === "ready" && !version.deletedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canActivate || isActivating}
                    onClick={() => handleActivate(version.id)}
                    aria-label={`Activate ${version.fileName ?? "this resume version"}`}
                    className="ml-2 shrink-0"
                  >
                    {isActivating ? (
                      <SpinnerIcon className="animate-[spin_1.5s_linear_infinite]" />
                    ) : (
                      "Activate"
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
