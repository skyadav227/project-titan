/**
 * DashboardHeader
 *
 * Sticky top bar for the TITAN Dashboard main content area.
 * Sits to the right of the sidebar on desktop (lg:ml-[240px] is on the parent).
 *
 * Left  : Time-based greeting + user name
 * Right : Streak badge (returning users) | Notification bell | Profile avatar
 *
 * Per spec (UI Spec Section 9, Component Spec Section 1):
 *   - Greeting changes based on time of day
 *   - Contains: Greeting, User Name, Notification, Profile Avatar
 *   - Streak and rank shown for returning users
 *   - Never display more than one greeting
 *
 * Notification panel:
 *   A small dropdown that lists unread and recent notifications.
 *   Clicking outside closes it (handled via useEffect + ref).
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../contexts/DashboardContext";
import { IconBell, IconFlame, IconStar } from "./ui/DashboardIcons";

// ─── NotificationPanel ───────────────────────────────────────────────────────

function NotificationPanel({ notifications, onClose }) {
  return (
    <div
      className="
        absolute right-0 top-full mt-2
        w-[320px] max-w-[calc(100vw-2rem)]
        bg-[#141414]
        border border-white/[0.08]
        rounded-2xl
        shadow-2xl
        overflow-hidden
        z-50
        animate-fade-in
      "
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white">Notifications</span>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded p-1"
          aria-label="Close notifications"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Items */}
      <ul className="max-h-[320px] overflow-y-auto" role="list">
        {notifications.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-white/30">
            You're all caught up.
          </li>
        ) : (
          notifications.map((n) => (
            <li key={n.id}>
              {n.route ? (
                <Link
                  to={n.route}
                  onClick={onClose}
                  className={`
                    flex items-start gap-3 px-4 py-3.5
                    border-b border-white/[0.04]
                    hover:bg-white/[0.03]
                    transition-colors duration-150
                    focus-visible:outline-none focus-visible:bg-white/[0.03]
                  `}
                >
                  <NotificationDot unread={!n.read} />
                  <NotificationContent label={n.label} time={n.time} />
                </Link>
              ) : (
                <div
                  className={`
                    flex items-start gap-3 px-4 py-3.5
                    border-b border-white/[0.04]
                  `}
                >
                  <NotificationDot unread={!n.read} />
                  <NotificationContent label={n.label} time={n.time} />
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={onClose}
          className="text-xs text-white/30 hover:text-white/60 transition-colors duration-150 focus-visible:outline-none"
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
}

function NotificationDot({ unread }) {
  return (
    <div className="flex-shrink-0 mt-1">
      {unread ? (
        <span className="block w-2 h-2 rounded-full bg-white/60" />
      ) : (
        <span className="block w-2 h-2 rounded-full bg-white/10" />
      )}
    </div>
  );
}

function NotificationContent({ label, time }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-sm text-white/80 leading-snug">{label}</p>
      <p className="text-xs text-white/30">{time}</p>
    </div>
  );
}

// ─── ProfileMenu ─────────────────────────────────────────────────────────────

function ProfileMenu({ user, onClose }) {
  return (
    <div
      className="
        absolute right-0 top-full mt-2
        w-[200px]
        bg-[#141414]
        border border-white/[0.08]
        rounded-2xl
        shadow-2xl
        overflow-hidden
        z-50
        animate-fade-in
      "
      role="menu"
      aria-label="Profile menu"
    >
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-white/[0.06]">
        <p className="text-sm font-medium text-white">{user.name}</p>
        <p className="text-xs text-white/35 mt-0.5 truncate">{user.email}</p>
      </div>

      {/* Menu items */}
      <ul className="py-1.5" role="list">
        {[
          { label: "Settings",    href: "/settings" },
          { label: "Resume",      href: "/resume"   },
        ].map(({ label, href }) => (
          <li key={label} role="none">
            <Link
              to={href}
              role="menuitem"
              onClick={onClose}
              className="
                flex items-center px-4 py-2.5
                text-sm text-white/55
                hover:text-white hover:bg-white/[0.04]
                transition-colors duration-150
                focus-visible:outline-none focus-visible:bg-white/[0.04]
              "
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Logout */}
      <div className="border-t border-white/[0.06] py-1.5">
        <Link
          to="/login"
          role="menuitem"
          onClick={onClose}
          className="
            flex items-center px-4 py-2.5
            text-sm text-white/40
            hover:text-white hover:bg-white/[0.04]
            transition-colors duration-150
            focus-visible:outline-none focus-visible:bg-white/[0.04]
          "
        >
          Logout
        </Link>
      </div>
    </div>
  );
}

// ─── DashboardHeader ─────────────────────────────────────────────────────────

export default function DashboardHeader() {
  const { data, greeting, unreadCount, isFirstTimeUser } = useDashboard();
  const { user, stats } = data;

  const [notifOpen, setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const notifications = !isFirstTimeUser ? (data.notifications ?? []) : [];

  return (
    <header
      className="
        sticky top-0 z-30
        flex items-center justify-between
        h-16 px-4 sm:px-6 lg:px-8
        border-b border-white/[0.05]
        bg-[#0a0a0a]/90
        backdrop-blur-md
        flex-shrink-0
        dash-header-enter
      "
      aria-label="Dashboard header"
    >
      {/* ── Left: Greeting ── */}
      <div className="flex flex-col gap-0 min-w-0">
        <h1 className="text-sm font-semibold text-white leading-tight truncate">
          {greeting},{" "}
          <span className="text-white/70">{user.name}</span>
        </h1>
        {!isFirstTimeUser && stats.streak > 0 && (
          <p className="text-xs text-white/30 leading-tight mt-0.5">
            {stats.streak}-day streak · {stats.level}
          </p>
        )}
        {isFirstTimeUser && (
          <p className="text-xs text-white/30 leading-tight mt-0.5">
            Let's get you started.
          </p>
        )}
      </div>

      {/* ── Right: Badges + Notification + Profile ── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Streak badge — returning users only, hidden on mobile */}
        {!isFirstTimeUser && stats.streak > 0 && (
          <div
            className="
              hidden sm:flex items-center gap-1.5
              px-3 py-1.5 rounded-lg
              border border-white/[0.07]
              bg-white/[0.03]
              text-xs font-medium text-white/50
            "
            title={`${stats.streak}-day streak`}
            aria-label={`${stats.streak}-day practice streak`}
          >
            <IconFlame className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="tabular-nums">{stats.streak}d</span>
          </div>
        )}

        {/* Rank badge — returning users only, hidden on small screens */}
        {!isFirstTimeUser && stats.rank && (
          <div
            className="
              hidden md:flex items-center gap-1.5
              px-3 py-1.5 rounded-lg
              border border-white/[0.07]
              bg-white/[0.03]
              text-xs font-medium text-white/50
            "
            title={`Rank #${stats.rank} of ${stats.totalUsers}`}
            aria-label={`Rank ${stats.rank} out of ${stats.totalUsers} users`}
          >
            <IconStar className="w-3.5 h-3.5 text-white/30" />
            <span className="tabular-nums">#{stats.rank}</span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            className="
              relative flex items-center justify-center
              w-9 h-9 rounded-xl
              border border-white/[0.07]
              bg-white/[0.03]
              text-white/40
              hover:text-white/70 hover:border-white/[0.12] hover:bg-white/[0.06]
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            "
          >
            <IconBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  w-4 h-4 rounded-full
                  bg-white text-black
                  text-[9px] font-bold
                  flex items-center justify-center
                  leading-none
                "
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* Profile avatar */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="
              flex items-center justify-center
              w-9 h-9 rounded-xl
              bg-white/[0.08]
              border border-white/[0.07]
              text-white text-sm font-semibold
              hover:bg-white/[0.12] hover:border-white/[0.15]
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
              select-none
            "
          >
            {user.avatarInitials}
          </button>

          {profileOpen && (
            <ProfileMenu
              user={user}
              onClose={() => setProfileOpen(false)}
            />
          )}
        </div>

      </div>
    </header>
  );
}
