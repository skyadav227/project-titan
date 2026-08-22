/**
 * RecentInterviewsCard
 *
 * Returning User only. Provides quick access to the last 5 interviews.
 *
 * Per spec (Component Spec §8, UI Spec §15):
 *   Each row: Role, Interview Type, Date, Score, View Report action
 *   Limit: Maximum 5 items
 *   Rows: Compact and readable
 *   Older interviews: accessed through History page
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import { IconHistory, IconInterview } from "../ui/DashboardIcons";

// ─── Score pill ───────────────────────────────────────────────────────────────

function ScorePill({ score }) {
  const color =
    score >= 75
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : score >= 60
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-red-400/80 bg-red-500/10 border-red-500/20";

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5 rounded-md
        border text-xs font-semibold tabular-nums
        ${color}
      `}
      aria-label={`Score: ${score} out of 100`}
    >
      {score}
    </span>
  );
}

// ─── Interview row ────────────────────────────────────────────────────────────

function InterviewRow({ interview }) {
  const date = new Date(interview.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <li className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      {/* Role + type */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-sm text-white/75 font-medium truncate">
          {interview.role}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/30 truncate">{interview.company}</span>
          <span className="text-white/15 hidden xs:inline" aria-hidden="true">·</span>
          <span className="text-xs text-white/25 truncate hidden xs:inline">{interview.type}</span>
        </div>
      </div>

      {/* Right: date, score, report link */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-white/25 hidden sm:block">{date}</span>
        {interview.score !== null && interview.score !== undefined
          ? <ScorePill score={interview.score} />
          : <span className="text-xs text-white/20 tabular-nums">—</span>
        }
        <Link
          to={interview.reportRoute}
          className="
            text-xs text-white/25 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded
            whitespace-nowrap
          "
          aria-label={`View report for ${interview.role}${interview.company ? ` at ${interview.company}` : ""}`}
        >
          Report →
        </Link>
      </div>
    </li>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function RecentInterviewsCard() {
  const { data } = useDashboard();
  const interviews = (data.recentInterviews ?? []).slice(0, 5);

  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={5}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <SectionLabel>Activity</SectionLabel>
          <h2 className="text-base font-semibold text-white">Recent Interviews</h2>
        </div>

        <Link
          to="/history"
          className="
            text-xs text-white/30 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none
            flex items-center gap-1
          "
          aria-label="View full interview history"
        >
          <IconHistory className="w-3.5 h-3.5" />
          View all
        </Link>
      </div>

      {/* Interview rows */}
      {interviews.length === 0 ? (
        <EmptyState
          icon={<IconInterview className="w-5 h-5" />}
          message="Your interview journey begins here. Complete your first interview to see it here."
          ctaLabel="Start Interview"
          ctaRoute="/interview"
        />
      ) : (
        <ul
          className="flex flex-col"
          role="list"
          aria-label="Recent interviews list"
        >
          {interviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
