/**
 * QuickActionsCard
 *
 * Fast navigation shortcuts. Both user states.
 *
 * Per spec (Component Spec §10, UI Spec §17):
 *   - Only frequently used actions
 *   - No duplicates
 *   - Each action must be instantly recognizable
 *
 * First-Time: Upload Resume, Explore Roles, Settings, Help
 * Returning:  Start Interview, Upload Resume, Reports, History, Leaderboard, Settings
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import {
  IconInterview,
  IconUpload,
  IconReports,
  IconHistory,
  IconLeaderboard,
  IconSettings,
  IconResume,
} from "../ui/DashboardIcons";

// ─── Action configurations ────────────────────────────────────────────────────

const FIRST_TIME_ACTIONS = [
  { label: "Upload Resume",  href: "/resume",      Icon: IconResume      },
  { label: "Explore Roles",  href: "/interview",   Icon: IconInterview   },
  { label: "Settings",       href: "/settings",    Icon: IconSettings    },
];

const RETURNING_ACTIONS = [
  { label: "Start Interview", href: "/interview",   Icon: IconInterview  },
  { label: "Upload Resume",   href: "/resume",      Icon: IconUpload     },
  { label: "Reports",         href: "/report",      Icon: IconReports    },
  { label: "History",         href: "/history",     Icon: IconHistory    },
  { label: "Leaderboard",     href: "/leaderboard", Icon: IconLeaderboard },
  { label: "Settings",        href: "/settings",    Icon: IconSettings   },
];

// ─── Single action button ─────────────────────────────────────────────────────

function ActionButton({ label, href, Icon }) {
  return (
    <Link
      to={href}
      className="
        group flex flex-col items-center justify-center gap-2
        p-4 rounded-xl
        border border-white/[0.06] bg-white/[0.02]
        hover:border-white/[0.12] hover:bg-white/[0.05]
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        text-center
        dash-btn-press
      "
      aria-label={label}
    >
      <div
        className="
          w-8 h-8 rounded-lg flex items-center justify-center
          border border-white/[0.07] bg-white/[0.03]
          text-white/35 group-hover:text-white/65
          transition-colors duration-150
        "
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs text-white/45 group-hover:text-white/70 transition-colors duration-150 leading-tight">
        {label}
      </span>
    </Link>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function QuickActionsCard() {
  const { isFirstTimeUser } = useDashboard();
  const actions = isFirstTimeUser ? FIRST_TIME_ACTIONS : RETURNING_ACTIONS;

  return (
    <DashboardCard enterIndex={6}>
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <SectionLabel>Navigation</SectionLabel>
        <h2 className="text-base font-semibold text-white">Quick Actions</h2>
      </div>

      {/* Actions grid — 2 cols on mobile, 3 on sm+ */}
      <div
        className={`
          grid gap-2
          ${isFirstTimeUser ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}
        `}
        role="list"
        aria-label="Quick action shortcuts"
      >
        {actions.map(({ label, href, Icon }) => (
          <ActionButton key={label} label={label} href={href} Icon={Icon} />
        ))}
      </div>
    </DashboardCard>
  );
}
