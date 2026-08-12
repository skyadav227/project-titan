/**
 * SkeletonLoader
 *
 * Shimmer skeleton used while dashboard sections load.
 * Preserves layout to prevent content shift.
 *
 * Per spec (UI Spec §23, Component Spec Loading Rules):
 *   "Skeleton loaders are preferred."
 *   "Loading should preserve layout to prevent content shifting."
 *   "Never shift layouts while loading."
 *
 * Uses the .dash-skeleton CSS class which provides the sweep animation.
 *
 * Props:
 *   className : string  — controls width, height, border-radius, additional classes
 *   lines     : number  — if > 0, renders N stacked line-shaped skeletons
 *   card      : boolean — if true, renders a full card-shaped skeleton
 */
export default function SkeletonLoader({ className = "", lines = 0, card = false }) {
  const base = "dash-skeleton";

  if (card) {
    return (
      <div
        className={`
          ${base}
          rounded-2xl border border-white/[0.05]
          ${className}
        `}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  if (lines > 0) {
    return (
      <div
        className={`flex flex-col gap-3 ${className}`}
        aria-hidden="true"
        role="presentation"
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${base} h-4 rounded-lg ${i === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${base} ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}
