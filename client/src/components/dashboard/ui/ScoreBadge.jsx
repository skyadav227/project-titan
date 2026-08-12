/**
 * ScoreBadge
 *
 * Displays a numeric score that animates from 0 to `score` on mount.
 * Respects prefers-reduced-motion.
 *
 * Per spec (UI Spec §12, Component Spec Animation Rules):
 *   "Numbers should animate smoothly when loaded."
 *   "Numbers — smooth counting."
 *
 * Props:
 *   score    : number (0–100)
 *   delta    : number | null  — positive = green, negative = amber
 *   size     : "sm" | "md" | "lg"
 *   animated : boolean        — enable count-up (default: true)
 *   delay    : number         — ms before counting starts (default: 0)
 */
import { useCountUp } from "../../../hooks/useCountUp";

const SIZE = {
  sm: { score: "text-lg font-bold",  delta: "text-[10px]" },
  md: { score: "text-2xl font-bold", delta: "text-xs"     },
  lg: { score: "text-4xl font-bold", delta: "text-sm"     },
};

export default function ScoreBadge({
  score,
  delta    = null,
  size     = "md",
  animated = true,
  delay    = 0,
}) {
  const s = SIZE[size] ?? SIZE.md;
  const counted = useCountUp(animated ? score : 0, 900, delay);
  const displayScore = animated ? counted : score;

  const deltaColor =
    delta === null  ? ""
    : delta > 0     ? "text-emerald-400"
    : delta < 0     ? "text-amber-400"
    :                  "text-white/30";

  const deltaSign = delta != null && delta > 0 ? "+" : "";

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`${s.score} text-white tabular-nums dash-num-reveal`}
        aria-label={`Score: ${score}`}
      >
        {displayScore}
      </span>
      {delta !== null && (
        <span className={`${s.delta} font-medium ${deltaColor}`} aria-hidden="true">
          {deltaSign}{delta}%
        </span>
      )}
    </div>
  );
}
