/**
 * ActivityFeedCard
 *
 * Returning User only. Chronological activity timeline.
 * Shows recent interviews, achievements, resume uploads, milestones.
 *
 * Per spec (Component Spec §9, UI Spec §16):
 *   - Newest first
 *   - Avoid unnecessary details
 *   - Examples: Interview completed, Resume uploaded,
 *               Achievement unlocked, Report generated
 */
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import { IconHistory } from "../ui/DashboardIcons";

// ─── Activity type → icon SVG map ────────────────────────────────────────────

function ActivityIcon({ type }) {
  const configs = {
    interview: {
      color: "text-white/40 border-white/[0.08] bg-white/[0.03]",
      svg: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 12c0-2.5 2-3.5 4.5-3.5s4.5 1 4.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    report: {
      color: "text-white/40 border-white/[0.08] bg-white/[0.03]",
      svg: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 11V7.5M5.5 11V4.5M8 11V6M10.5 11V2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M1.5 11h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    achievement: {
      color: "text-amber-400/70 border-amber-500/20 bg-amber-500/10",
      svg: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 2l1.3 2.5 2.7.4-2 1.9.5 2.7L7 8.3 4.5 9.5l.5-2.7L3 4.9l2.7-.4L7 2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      ),
    },
    resume: {
      color: "text-white/40 border-white/[0.08] bg-white/[0.03]",
      svg: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="2.5" y="1.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  const config = configs[type] ?? configs.interview;

  return (
    <div
      className={`
        flex-shrink-0 w-7 h-7 rounded-lg
        flex items-center justify-center
        border
        ${config.color}
      `}
      aria-hidden="true"
    >
      {config.svg}
    </div>
  );
}

// ─── Single activity item ─────────────────────────────────────────────────────

function ActivityItem({ activity, isLast }) {
  return (
    <li className="flex items-start gap-3">
      {/* Icon + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <ActivityIcon type={activity.type} />
        {!isLast && (
          <div className="w-px flex-1 mt-1 min-h-[16px] bg-white/[0.05]" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 pb-4 min-w-0">
        <span className="text-sm text-white/65 leading-snug">
          {activity.label}
        </span>
        <span className="text-xs text-white/25">{activity.time}</span>
      </div>
    </li>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ActivityFeedCard() {
  const { data } = useDashboard();
  const feed = data.activityFeed ?? [];

  return (
    <DashboardCard className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <SectionLabel>Timeline</SectionLabel>
        <h2 className="text-base font-semibold text-white">Activity Feed</h2>
      </div>

      {feed.length === 0 ? (
        <EmptyState
          icon={<IconHistory className="w-5 h-5" />}
          message="Your activity timeline will appear here after your first interview."
          ctaLabel="Start Interview"
          ctaRoute="/interview"
        />
      ) : (
        /*
         * Two-column grid on sm+ so the full-width card doesn't leave
         * excessive empty space. Timeline connectors are hidden when
         * items are in a multi-column layout.
         */
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-8"
          role="list"
          aria-label="Recent activity timeline"
        >
          {feed.map((item, i) => (
            <ActivityItem
              key={item.id}
              activity={item}
              isLast={i === feed.length - 1}
            />
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
