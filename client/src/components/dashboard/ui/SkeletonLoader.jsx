/**
 * SkeletonLoader
 *
 * Shimmer skeleton used while dashboard sections load.
 * Preserves layout to prevent content shift.
 *
 * Props:
 *   className : string  — controls width, height, border-radius
 *   lines     : number  — renders N stacked skeleton lines (optional pattern)
 */
export default function SkeletonLoader({ className = "", lines = 0 }) {
  const shimmerClass = `
    bg-white/[0.05] rounded-lg
    relative overflow-hidden
    before:absolute before:inset-0
    before:bg-gradient-to-r
    before:from-transparent before:via-white/[0.04] before:to-transparent
    before:translate-x-[-100%]
    before:animate-[shimmer_1.8s_ease_infinite]
  `;

  if (lines > 0) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"} ${shimmerClass}`}
          />
        ))}
      </div>
    );
  }

  return <div className={`${shimmerClass} ${className}`} />;
}
