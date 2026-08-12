/**
 * GettingStartedCard
 *
 * First-Time User only. Onboarding checklist.
 * Progress updates automatically as items are completed.
 * Completed items remain visible with a strikethrough + check.
 *
 * Per spec (Component Spec §11, PRD §8):
 *   Checklist: Upload Resume, Choose Role, Choose Skills,
 *              Complete Interview, View Report
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import AnimatedBar from "../ui/AnimatedBar";
import { IconCheck } from "../ui/DashboardIcons";

function ChecklistItem({ item, index }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      {/* Index / check icon */}
      <div
        className={`
          flex-shrink-0
          w-6 h-6 rounded-lg
          flex items-center justify-center
          border transition-all duration-200
          ${item.completed
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-white/[0.10] bg-white/[0.03] text-white/25"
          }
        `}
        aria-hidden="true"
      >
        {item.completed
          ? <IconCheck className="w-3.5 h-3.5" />
          : <span className="text-[10px] font-semibold">{index + 1}</span>
        }
      </div>

      {/* Label */}
      <span
        className={`
          flex-1 text-sm
          transition-colors duration-200
          ${item.completed
            ? "text-white/30 line-through"
            : "text-white/70"
          }
        `}
      >
        {item.label}
      </span>

      {/* Action arrow — only on incomplete items */}
      {!item.completed && item.route && (
        <Link
          to={item.route}
          className="
            flex-shrink-0 text-white/20 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded
          "
          aria-label={`Go to: ${item.label}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </li>
  );
}

export default function GettingStartedCard() {
  const { data } = useDashboard();
  const checklist = data.onboarding?.checklist ?? [];
  const completedCount = checklist.filter((i) => i.completed).length;
  const total = checklist.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <DashboardCard enterIndex={2}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Setup</SectionLabel>
          <h2 className="text-base font-semibold text-white">Getting Started</h2>
        </div>
        <span className="text-xs text-white/30 tabular-nums">
          {completedCount}/{total}
        </span>
      </div>

      {/* Progress bar — animated */}
      <div className="mb-5">
        <AnimatedBar
          value={progressPct}
          colorClass="bg-white/60"
          delay={100}
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        />
      </div>

      {/* Checklist */}
      <ul className="flex flex-col" role="list" aria-label="Getting started checklist">
        {checklist.map((item, i) => (
          <ChecklistItem key={item.id} item={item} index={i} />
        ))}
      </ul>
    </DashboardCard>
  );
}
