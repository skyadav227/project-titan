/**
 * ReportPage
 *
 * Displays the final performance report for a specific interview session.
 * Reachable via /history/:sessionId.
 *
 * This page is the canonical location for all interview reports — both
 * completed interviews and interrupted/abandoned ones with a generated report.
 *
 * Reuses the existing MasterReport component (and by extension the
 * InterviewContext) so no report-rendering logic is duplicated.
 *
 * Flow:
 *   /history/:sessionId
 *     → ReportPage mounts
 *     → calls restoreSession(sessionId) from InterviewContext
 *     → InterviewContext loads the session + its report from the backend
 *     → uiState transitions to "report_ready"
 *     → MasterReport renders from the loaded context state
 */
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import MasterReport    from "../components/interview/MasterReport";
import SkeletonLoader  from "../components/dashboard/ui/SkeletonLoader";
import DashboardCard   from "../components/dashboard/ui/DashboardCard";
import Button          from "../components/ui/Button";
import { useInterview } from "../contexts/InterviewContext";

// ── Timestamp formatter (mirrors HistoryPage helper — kept local to avoid
//    a shared-util file just for two pages) ────────────────────────────────────
function formatInterviewTimestamp(value) {
  if (value === null || value === undefined) return "Not available";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Not available";
  return d.toLocaleString(undefined, {
    month:  "short",
    day:    "numeric",
    year:   "numeric",
    hour:   "numeric",
    minute: "2-digit",
  });
}

// ── Interview timeline card ───────────────────────────────────────────────────
// Displayed at the top of the report, above MasterReport's own sections.
// Reads startedAt and completedAt directly from the session DTO.
function InterviewTimeline({ session }) {
  if (!session) return null;
  return (
    <DashboardCard className="dash-card-enter">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">
        Interview Timeline
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-white/25 w-14 flex-shrink-0">Started</span>
          <span className="text-xs text-white/55">
            {formatInterviewTimestamp(session.startedAt)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-white/25 w-14 flex-shrink-0">Ended</span>
          <span className="text-xs text-white/55">
            {formatInterviewTimestamp(session.completedAt)}
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}

function ReportPageContent() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const { uiState, isLoading, error, session, restoreSession } = useInterview();

  // Load the session and its report when the page mounts or sessionId changes.
  //
  // IMPORTANT: we pass a getCancelled function so that if this page unmounts
  // before the async restoreSession completes (e.g. user navigates to
  // /interview/setup before the API responds), the in-flight dispatches are
  // suppressed. Without this, the stale async callback would overwrite the
  // "setup" state that InterviewPage's goToSetup() already set, causing
  // InterviewPage to show skeleton loaders forever or redirect back here.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    restoreSession(sessionId, () => cancelled);
    return () => { cancelled = true; };
    // restoreSession is stable (useCallback with empty deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || uiState === "idle") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SkeletonLoader className="h-8 w-64 rounded-lg" />
        <SkeletonLoader className="h-40 rounded-2xl" />
        <SkeletonLoader className="h-40 rounded-2xl" />
        <SkeletonLoader className="h-32 rounded-2xl" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (uiState === "error" || error) {
    return (
      <div className="max-w-xl mx-auto">
        <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="w-12 h-12 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">
              {error?.message || "We couldn't load this report."}
            </p>
            <p className="text-xs text-white/35 mt-1">
              The report may not be available yet, or this session may not exist.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate("/history")}>
              View History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/interview/setup")}>
              New Interview
            </Button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  // ── No report available (session exists but report not generated) ─────────
  if (uiState !== "report_ready") {
    return (
      <div className="max-w-xl mx-auto">
        <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <svg className="w-5 h-5 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">No report available</p>
            <p className="text-xs text-white/35 mt-1">
              A report hasn&apos;t been generated for this interview yet.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => navigate("/history")}>
              View History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/interview/setup")}>
              New Interview
            </Button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  // ── Report ready ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4 dash-card-enter">
      {/* ── Back to History ─────────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="
            flex items-center gap-1.5
            text-xs text-white/40 hover:text-white/70
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded
          "
          aria-label="Back to History"
        >
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to History
        </button>
      </div>

      {/* ── Interview timeline ───────────────────────────────────────────── */}
      <InterviewTimeline session={session} />

      {/* ── Full report (all existing sections) ─────────────────────────── */}
      <MasterReport />
    </div>
  );
}

export default function ReportPage() {
  return (
    <DashboardLayout>
      <ReportPageContent />
    </DashboardLayout>
  );
}
