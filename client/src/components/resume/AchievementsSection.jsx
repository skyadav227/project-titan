/**
 * AchievementsSection — Omitted entirely when empty.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";

export default function AchievementsSection({ achievements }) {
  if (!Array.isArray(achievements) || achievements.length === 0) return null;

  return (
    <DashboardCard enterIndex={8}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/30 mb-4">Achievements</h3>
      <ul className="flex flex-col gap-2">
        {achievements.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/55">
            <span className="text-white/20 mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
            {a}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
