/**
 * TodaysMissionCard
 *
 * Returning User only. Daily objectives.
 * Tasks update automatically. Completed tasks show a check.
 *
 * Per spec (Component Spec §3, PRD §9):
 *   Purpose: Give users small achievable goals.
 *   Examples: Complete one interview, Improve communication,
 *             Practice React, Upload updated resume
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import { IconCheck } from "../ui/DashboardIcons";

function MissionItem({ mission }) {
  return (
    <li
      className={`
        flex items-center gap-3
        py-2.5
        border-b border-white/[0.04] last:border-0
      `}
    >
      {/* Status indicator */}
      <div
        className={`
          flex-shrink-0 w-5 h-5 rounded-full
          flex items-center justify-center
          border transition-all duration-200
          ${mission.completed
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-white/[0.03] border-white/[0.10]"
          }
        `}
        aria-hidden="true"
      >
        {mission.completed && <IconCheck className="w-3 h-3" />}
      </div>

      {/* Label */}
      <span
        className={`
          flex-1 text-sm leading-snug
          ${mission.completed ? "text-white/30 line-through" : "text-white/70"}
        `}
      >
        {mission.label}
      </span>

      {/* Go arrow — incomplete only */}
      {!mission.completed && mission.route && (
        <Link
          to={mission.route}
          className="
            flex-shrink-0 text-white/20 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded
          "
          aria-label={`Start: ${mission.label}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </li>
  );
}

export default function TodaysMissionCard() {
  const { data } = useDashboard();
  const missions = data.todaysMissions ?? [];
  const doneCount = missions.filter((m) => m.completed).length;

  return (
    <DashboardCard className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <SectionLabel>Daily focus</SectionLabel>
          <h2 className="text-base font-semibold text-white">Today's Mission</h2>
        </div>
        <span
          className={`
            text-xs font-medium tabular-nums px-2 py-1 rounded-lg
            ${doneCount === missions.length
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-white/30 bg-white/[0.04] border border-white/[0.06]"
            }
          `}
          aria-label={`${doneCount} of ${missions.length} missions completed`}
        >
          {doneCount}/{missions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full bg-white/[0.06] overflow-hidden"
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={missions.length}
        aria-label="Daily mission progress"
      >
        <div
          className="h-full rounded-full bg-white/50 transition-all duration-500"
          style={{ width: `${(doneCount / missions.length) * 100}%` }}
        />
      </div>

      {/* Mission list */}
      <ul className="flex flex-col" role="list" aria-label="Today's missions">
        {missions.map((mission) => (
          <MissionItem key={mission.id} mission={mission} />
        ))}
      </ul>

      {doneCount === missions.length && (
        <p className="text-xs text-emerald-400/70 text-center pt-1">
          All missions complete. Great work today!
        </p>
      )}
    </DashboardCard>
  );
}
