/**
 * AnimatedBar
 *
 * A progress/score bar that animates from 0% to `value`% when it
 * first enters the viewport.
 *
 * Per spec (Motion Design):
 *   "Animations should improve clarity."
 *   Progress bars animating in communicates that data was freshly computed.
 *
 * Respects prefers-reduced-motion — renders at full width immediately.
 *
 * Props:
 *   value     : number   — 0–100
 *   colorClass: string   — Tailwind bg color class (default: "bg-white/50")
 *   className : string   — outer track classes
 *   delay     : number   — ms before animation begins (default: 200)
 *   height    : string   — track height class (default: "h-1")
 */
import { useRef, useState, useEffect } from "react";

const getReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedBar({
  value,
  colorClass  = "bg-white/50",
  className   = "",
  delay       = 200,
  height      = "h-1",
}) {
  const trackRef = useRef(null);
  // Initialise `active` to true if reduced motion is preferred — no animation needed
  const [active, setActive] = useState(() => getReducedMotion());

  useEffect(() => {
    // Skip observer setup if already active (reduced motion case)
    if (active) return;

    const el = trackRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return (
    <div
      ref={trackRef}
      className={`rounded-full bg-white/[0.06] overflow-hidden ${height} ${className}`}
    >
      <div
        className={`${height} rounded-full ${colorClass}`}
        style={{
          width: active ? `${value}%` : "0%",
          transition: active
            ? `width 0.75s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
            : "none",
          willChange: "width",
        }}
      />
    </div>
  );
}
