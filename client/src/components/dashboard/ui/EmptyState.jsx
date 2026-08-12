/**
 * EmptyState
 *
 * Replaces blank/missing data sections with a guided message.
 * Per spec: every empty state should educate and guide — never show "No Data".
 *
 * Props:
 *   icon      : ReactNode   — small SVG icon
 *   message   : string      — primary guidance text
 *   ctaLabel  : string      — button label (optional)
 *   ctaRoute  : string      — route to navigate on CTA click (optional)
 *   className : string
 */
import { Link } from "react-router-dom";

export default function EmptyState({
  icon,
  message,
  ctaLabel,
  ctaRoute,
  className = "",
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-4
        py-8 px-4 text-center
        ${className}
      `}
    >
      {icon && (
        <div
          className="
            w-10 h-10 rounded-xl
            border border-white/[0.07]
            bg-white/[0.03]
            flex items-center justify-center
            text-white/25
          "
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <p className="text-sm text-white/40 leading-relaxed max-w-[260px]">
        {message}
      </p>

      {ctaLabel && ctaRoute && (
        <Link
          to={ctaRoute}
          className="
            inline-flex items-center gap-1.5
            px-4 py-2 text-xs font-medium
            text-white/70 border border-white/[0.10]
            rounded-lg
            hover:border-white/20 hover:text-white
            transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
          "
        >
          {ctaLabel}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
