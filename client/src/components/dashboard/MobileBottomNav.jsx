/**
 * MobileBottomNav
 *
 * Fixed bottom navigation bar shown only on mobile (hidden on lg+).
 * Mirrors the sidebar's primary navigation with icon + label.
 *
 * Shows the 5 most important nav items that fit comfortably.
 * Per spec (Section 11, Responsive Design Section 14):
 *   - Dashboard, Interview, Reports, History, Settings
 *   - Resume and Leaderboard are accessible via the Dashboard or sidebar on desktop.
 *
 * Active item: white icon + white label.
 * Inactive:    white/40 icon, no label (space-efficient).
 * Active item shows label below icon, inactive items are icon-only on very small screens.
 */
import { Link, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconInterview,
  IconReports,
  IconHistory,
  IconSettings,
} from "./ui/DashboardIcons";

const MOBILE_NAV = [
  { label: "Dashboard",  href: "/dashboard",  Icon: IconDashboard  },
  { label: "Interview",  href: "/interview",  Icon: IconInterview  },
  { label: "Reports",    href: "/report",     Icon: IconReports    },
  { label: "History",    href: "/history",    Icon: IconHistory    },
  { label: "Settings",   href: "/settings",   Icon: IconSettings   },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Mobile navigation"
      className="
        lg:hidden
        fixed bottom-0 left-0 right-0
        z-40
        flex items-center justify-around
        h-16
        bg-[#0d0d0d]/95
        border-t border-white/[0.06]
        backdrop-blur-md
        px-2
        safe-area-inset-bottom
      "
    >
      {MOBILE_NAV.map(({ label, href, Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={label}
            to={href}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            className={`
              flex flex-col items-center justify-center
              gap-1 flex-1
              h-full
              min-w-0
              rounded-xl mx-0.5
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
              ${isActive
                ? "text-white"
                : "text-white/35 hover:text-white/60"
              }
            `}
          >
            {/* Icon wrapper — active gets a subtle pill background */}
            <div
              className={`
                flex items-center justify-center
                w-8 h-8 rounded-xl
                transition-all duration-150
                ${isActive
                  ? "bg-white/[0.10]"
                  : "bg-transparent"
                }
              `}
            >
              <Icon className="w-[18px] h-[18px]" />
            </div>

            {/* Label — always visible on mobile */}
            <span
              className={`
                text-[10px] font-medium leading-none
                transition-opacity duration-150
                ${isActive ? "opacity-100" : "opacity-50"}
              `}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
