/**
 * ScoreBadge
 *
 * Displays a numeric score with an optional delta (change).
 * Used in Performance Overview cards and Recent Interviews table.
 *
 * Props:
 *   score   : number (0–100)
 *   delta   : number | null  — positive shows green, negative shows amber
 *   size    : "sm" | "md" | "lg"
 */

const SIZE = {
  sm: { score: "text-lg font-bold", delta: "text-[10px]" },
  md: { score: "text-2xl font-bold", delta: "text-xs" },
  lg: { score: "text-4xl font-bold", delta: "text-sm" },
};

export default function ScoreBadge({ score, delta = null, size = "md" }) {
  const s = SIZE[size] ?? SIZE.md;

  const deltaColor =
    delta === null
      ? ""
      : delta > 0
      ? "text-emerald-400"
      : delta < 0
      ? "text-amber-400"
      : "text-white/30";

  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${s.score} text-white tabular-nums`}>{score}</span>
      {delta !== null && (
        <span className={`${s.delta} font-medium ${deltaColor}`}>
          {deltaSign}{delta}%
        </span>
      )}
    </div>
  );
}
