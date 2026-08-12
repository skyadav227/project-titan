/**
 * DashboardSidebar
 *
 * Persistent left navigation for the TITAN Dashboard (desktop only).
 * Fixed position, 240px wide. Hidden below lg breakpoint.
 *
 * Sections:
 *   Top    : TITAN logo
 *   Middle : Primary navigation links (Dashboard → Settings)
 *   Bottom : Feedback + Logout
 *
 * Active state is derived from the current pathname.
 * The active item gets a white background with black text (same as primary button).
 * Hover state is a subtle white/4% background.
 *
 * Per spec (Section 11, UI Spec Section 10):
 *   Navigation order: Dashboard, Interview, Reports, History, Leaderboard, Resume, Settings
 *   Bottom: Feedback, Logout
 */
import { Link, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconInterview,
  IconReports,
  IconHistory,
  IconLeaderboard,
  IconResume,
  IconSettings,
  IconFeedback,
  IconLogout,
} from "./ui/DashboardIcons";

// ─── Navigation config ────────────────────────────────────────────────────────

const PRIMARY_NAV = [
  { label: "Dashboard",    href: "/dashboard",    Icon: IconDashboard   },
  { label: "Interview",    href: "/interview",    Icon: IconInterview   },
  { label: "Reports",      href: "/report",       Icon: IconReports     },
  { label: "History",      href: "/history",      Icon: IconHistory     },
  { label: "Leaderboard",  href: "/leaderboard",  Icon: IconLeaderboard },
  { label: "Resume",       href: "/resume",       Icon: IconResume      },
  { label: "Settings",     href: "/settings",     Icon: IconSettings    },
];

const BOTTOM_NAV = [
  { label: "Feedback",  href: "/feedback", Icon: IconFeedback },
  { label: "Logout",    href: "/login",    Icon: IconLogout   },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({ label, href, Icon, isActive }) {
  return (
    <Link
      to={href}
      aria-current={isActive ? "page" : undefined}
      className={`
        group flex items-center gap-3
        px-3 py-2.5 rounded-xl
        text-sm font-medium
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
        ${isActive
          ? "bg-white text-black"
          : "text-white/50 hover:text-white hover:bg-white/[0.05]"
        }
      `}
    >
      <Icon
        className={`
          w-[18px] h-[18px] flex-shrink-0
          transition-colors duration-150
          ${isActive ? "text-black" : "text-white/40 group-hover:text-white/70"}
        `}
      />
      <span>{label}</span>
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function DashboardSidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      aria-label="Dashboard navigation"
      className={`
        hidden lg:flex
        fixed top-0 left-0 bottom-0
        w-[240px]
        flex-col
        bg-[#0d0d0d]
        border-r border-white/[0.06]
        z-40
        dash-sidebar-enter
      `}
    >
      {/* ── Logo ── */}
      <div className="flex-shrink-0 px-5 h-16 flex items-center border-b border-white/[0.05]">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
          aria-label="TITAN Dashboard home"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)" }}
            aria-hidden="true"
          >
            <span className="text-black text-xs font-black tracking-tight">T</span>
          </div>
          <span className="text-white font-bold text-base tracking-tight">TITAN</span>
        </Link>
      </div>

      {/* ── Primary navigation ── */}
      <nav
        aria-label="Primary navigation"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="flex flex-col gap-0.5" role="list">
          {PRIMARY_NAV.map(({ label, href, Icon }) => (
            <li key={label}>
              <NavItem
                label={label}
                href={href}
                Icon={Icon}
                isActive={pathname === href || (href !== "/dashboard" && pathname.startsWith(href))}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3 h-px bg-white/[0.05]" aria-hidden="true" />

      {/* ── Bottom navigation ── */}
      <nav
        aria-label="Secondary navigation"
        className="flex-shrink-0 px-3 py-4"
      >
        <ul className="flex flex-col gap-0.5" role="list">
          {BOTTOM_NAV.map(({ label, href, Icon }) => (
            <li key={label}>
              <NavItem
                label={label}
                href={href}
                Icon={Icon}
                isActive={false}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
