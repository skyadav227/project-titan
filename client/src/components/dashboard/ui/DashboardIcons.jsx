/**
 * DashboardIcons
 *
 * All SVG icons used within the TITAN Dashboard, exported by name.
 * Using a single source ensures visual consistency across all components.
 *
 * All icons are 20×20 viewBox by default, drawn with currentColor.
 * Wrapper: pass `className` to the component to control size/color.
 *
 * Usage:
 *   import { IconInterview } from "./ui/DashboardIcons";
 *   <IconInterview className="w-5 h-5 text-white/50" />
 */

const icon = (path, extra = "") => ({
  className = "w-5 h-5",
}) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {typeof path === "string" ? (
      <path stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d={path} />
    ) : (
      path
    )}
  </svg>
);

// Navigation
export const IconDashboard = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const IconInterview = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3.5 17c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M14 4l1.5-1.5M15.5 6.5H17M14 9l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconReports = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 16V10M7.5 16V6M11 16V9M14.5 16V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M2.5 16h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconHistory = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 10a6.5 6.5 0 1 1 0 .01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M3.5 10L1.5 8M3.5 10L1.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconLeaderboard = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 3l1.8 3.6 4 .6-2.9 2.8.7 4L10 12l-3.6 1.9.7-4L4.2 7.2l4-.6L10 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M4 17h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconResume = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="4" y="2.5" width="12" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconSettings = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.1 4.1l1.4 1.4M14.5 14.5l1.4 1.4M4.1 15.9l1.4-1.4M14.5 5.5l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconFeedback = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7l-3 2V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconLogout = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M13 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 10H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconBell = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 3a5 5 0 0 1 5 5v3l1.5 2.5H3.5L5 11V8a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8.5 16a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const IconChevronRight = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconArrowUp = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconStar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const IconFlame = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2c0 3-3 3.5-3 6a3 3 0 0 0 6 0c0-1.5-1-2.5-1-4 0 0-1 1-1 2.5C8 7.5 7 7 7 6c0-1 1-4 1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const IconAI = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 10a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="8.5" r="1" fill="currentColor" />
    <circle cx="12" cy="8.5" r="1" fill="currentColor" />
    <path d="M10 3.5V2M10 18v-1.5M3.5 10H2M18 10h-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconUpload = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 13V4M6 8l4-4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const IconPlay = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M6 4l10 6-10 6V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
