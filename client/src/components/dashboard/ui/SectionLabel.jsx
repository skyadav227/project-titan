/**
 * SectionLabel
 *
 * Small uppercase label that sits above a section title.
 * Consistent with the landing page's section labelling pattern.
 *
 * Props:
 *   children  : string
 *   className : string
 */
export default function SectionLabel({ children, className = "" }) {
  return (
    <p
      className={`
        text-[10px] font-semibold uppercase tracking-[0.12em]
        text-white/25
        ${className}
      `}
    >
      {children}
    </p>
  );
}
