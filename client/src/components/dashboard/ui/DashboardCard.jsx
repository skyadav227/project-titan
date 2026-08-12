/**
 * DashboardCard
 *
 * The base card primitive for the TITAN dashboard.
 * Every section card wraps its content in this component.
 *
 * Per spec (UI Spec §8):
 *   - Rounded corners
 *   - Soft border
 *   - Minimal shadow
 *   - Consistent padding
 *   - Hover should create slight elevation
 *   - Cards should never bounce, shake, or rotate
 *   - Cards should feel stable
 *
 * Per spec (UI Spec §19, Motion Design):
 *   - Cards fade upward on entrance
 *   - Animations should improve usability
 *
 * Props:
 *   children      : ReactNode
 *   className     : string   — additional classes on the outer element
 *   noPadding     : boolean  — remove default padding (custom-layout cards)
 *   hoverable     : boolean  — enable subtle hover elevation
 *   enterIndex    : number   — 1–9 stagger index for entrance animation
 *                             If 0 or undefined, no entrance animation
 *   as            : string   — HTML element to render (default: "div")
 */
export default function DashboardCard({
  children,
  className    = "",
  noPadding    = false,
  hoverable    = false,
  enterIndex   = 0,
  as: Tag      = "div",
}) {
  const enterClass =
    enterIndex > 0
      ? `dash-card-enter dash-card-enter-${Math.min(enterIndex, 9)}`
      : "";

  const hoverClass = hoverable ? "dash-card-hover" : "";

  return (
    <Tag
      className={`
        rounded-2xl
        border border-white/[0.07]
        bg-[#111111]
        ${noPadding ? "" : "p-5 sm:p-6"}
        ${hoverClass}
        ${enterClass}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
