/**
 * HistoryPage
 *
 * Displays the user's past interview sessions.
 * Per interview-ui-spec.md §43, interview-wireframe.md §65.
 *
 * Fetches from GET /api/interviews — all data from backend.
 * No hardcoded data.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardCard   from "../components/dashboard/ui/DashboardCard";
import Button          from "../components/ui/Button";
import SkeletonLoader  from "../components/dashboard/ui/SkeletonLoader";
import { getInterviewHistory } from "../services/interviewService";

// ── Timestamp formatter ───────────────────────────────────────────────────────
// Converts a raw timestamp value (ISO string, Date, or null/undefined) into a
// human-readable string using the browser locale.
// Returns "Not available" for null/undefined/invalid values — never throws.
function formatInterviewTimestamp(value) {
  if (value === null || value === undefined) return "Not available";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Not available";
  return d.toLocaleString(undefined, {
    month: "short",
    day:   "numeric",
    year:  "numeric",
    hour:  "numeric",
    minute: "2-digit",
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    completed:  "border-green-500/25 text-green-400/70",
    abandoned:  "border-white/10 text-white/30",
    active:     "border-yellow-500/25 text-yellow-400/60",
    failed:     "border-red-500/20 text-red-400/50",
  };
  const cls = map[status] || "border-white/10 text-white/30";
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  );
}

// ── Timestamp row ─────────────────────────────────────────────────────────────
// Renders a single "Started / Ended" label + value pair inside a history card.
function TimestampRow({ label, value, isInProgress = false }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-white/25 w-12 flex-shrink-0">{label}</span>
      {isInProgress ? (
        <span className="text-xs text-yellow-400/60">In progress</span>
      ) : (
        <span className="text-xs text-white/40">{formatInterviewTimestamp(value)}</span>
      )}
    </div>
  );
}

// ── Interview history card ────────────────────────────────────────────────────
function InterviewCard({ interview, onClick }) {
  const hasReport  = (interview.overallScore !== null && interview.overallScore !== undefined)
    || interview.status === "completed";
  const isActive   = interview.status === "active";
  const isClickable = hasReport || isActive;

  // Derive a display date for aria-label fallback (used even if startedAt is null)
  const ariaDate = formatInterviewTimestamp(interview.startedAt || interview.completedAt || interview.createdAt);

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`w-full text-left ${!isClickable ? "cursor-default" : ""}`}
      aria-label={
        isActive  ? `Resume interview from ${ariaDate}` :
        hasReport ? `View report for interview from ${ariaDate}` :
                    `Interview from ${ariaDate} — no report available`
      }
    >
      <DashboardCard hoverable={isClickable} className="transition-all duration-150">
        <div className="flex items-start justify-between gap-4">
          {/* ── Left: title, badges, timestamps ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-medium text-white/80 truncate">
                {interview.role || interview.interviewType || "Interview"}
              </span>
              <StatusBadge status={interview.status} />
              {isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-500/20 text-yellow-400/60">
                  Resume →
                </span>
              )}
            </div>

            {/* Secondary meta: type, company, question count */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-white/30 mb-2.5">
              {interview.company && <span>· {interview.company}</span>}
              <span>{interview.interviewType}</span>
              {interview.questionCount > 0 && (
                <span>{interview.questionCount} question{interview.questionCount !== 1 ? "s" : ""}</span>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex flex-col gap-0.5">
              <TimestampRow label="Started" value={interview.startedAt} />
              <TimestampRow
                label="Ended"
                value={interview.completedAt}
                isInProgress={isActive}
              />
            </div>
          </div>

          {/* ── Right: score or status badge ── */}
          {hasReport ? (
            <div className="text-right flex-shrink-0">
              {interview.overallScore !== null && interview.overallScore !== undefined && (
                <>
                  <p className="text-xl font-semibold text-white">{interview.overallScore}</p>
                  <p className="text-xs text-white/25">/100</p>
                </>
              )}
            </div>
          ) : isActive ? (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-yellow-400/50">in progress</p>
            </div>
          ) : (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-white/20">no report</p>
            </div>
          )}
        </div>
      </DashboardCard>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyHistory({ onStart }) {
  return (
    <DashboardCard className="flex flex-col items-center gap-5 py-14 text-center dash-card-enter">
      <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center" aria-hidden="true">
        <svg className="w-5 h-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">No interviews yet</p>
        <p className="text-xs text-white/30 mt-1 max-w-xs">
          Your performance history will appear here after your first interview.
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onStart}>
        Start Your First Interview
      </Button>
    </DashboardCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function HistoryPageContent() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewHistory({ page: p, limit: 20 });
      setInterviews(data.interviews || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err?.message || "Couldn't load interview history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(page); }, [page, fetchHistory]);

  function handleInterviewClick(interview) {
    if (interview.status === "active") {
      // Resume the active session — navigate to the live session route.
      // InterviewPage will call restoreSession(id) which loads the current
      // question from the backend. No duplicate session is created.
      navigate(`/interview/session/${interview.id}`);
      return;
    }
    // Completed session with a report
    const hasReport = interview.overallScore !== null && interview.overallScore !== undefined;
    if (hasReport || interview.status === "completed") {
      navigate(`/history/${interview.id}`);
    }
    // Abandoned/failed with no report — card is disabled, click never fires.
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1,2,3].map(i => <SkeletonLoader key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Interview History</h1>
          {pagination && (
            <p className="text-xs text-white/30 mt-0.5">
              {pagination.total} session{pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate("/interview/setup")}>
          New Interview
        </Button>
      </div>

      {error && (
        <DashboardCard className="mb-4 text-center py-8">
          <p className="text-sm text-white/50">{error}</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => fetchHistory(page)}>
            Retry
          </Button>
        </DashboardCard>
      )}

      {!error && interviews.length === 0 && (
        <EmptyHistory onStart={() => navigate("/interview/setup")} />
      )}

      {!error && interviews.length > 0 && (
        <div className="space-y-3 dash-card-enter">
          {interviews.map((interview, i) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onClick={() => handleInterviewClick(interview)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-white/30">
            {page} of {pagination.pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <HistoryPageContent />
    </DashboardLayout>
  );
}
