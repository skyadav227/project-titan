/**
 * DashboardCard
 *
 * The base card primitive for the TITAN dashboard.
 * Every section card wraps its content in this component.
 *
 * Props:
 *   children    : ReactNode
 *   className   : string  — additional classes applied to the outer div
 *   noPadding   : boolean — remove default padding (for cards with custom layout)
 *   hoverable   : boolean — enable subtle hover elevation (default: false)
 *   as          : string  — HTML element to render (default: "div")
 */
export default function DashboardCard({
  children,
  className = "",
  noPadding = false,
  hoverable = false,
  as: Tag = "div",
}) {
  return (
    <Tag
      className={`
        rounded-2xl
        border border-white/[0.07]
        bg-[#111111]
        ${noPadding ? "" : "p-5 sm:p-6"}
        ${hoverable
          ? "transition-all duration-200 hover:border-white/[0.12] hover:bg-[#161616]"
          : ""}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
