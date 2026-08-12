/**
 * ResumeProcessing
 *
 * Shows meaningful processing stages. No fake percentages.
 * Stages are communicated via aria-live for screen readers.
 * Per spec §11/§25: "Animations should communicate state changes."
 */
import { useResume } from "../../contexts/ResumeContext";
import DashboardCard from "../dashboard/ui/DashboardCard";

const STAGES = [
  { key: "reading",           label: "Resume uploaded"           },
  { key: "extracting",        label: "Reading resume"            },
  { key: "understanding",     label: "Extracting information"    },
  { key: "building_context",  label: "Understanding your profile"},
  { key: "complete",          label: "Building interview context"},
];

const STAGE_ORDER = STAGES.map((s) => s.key);

function getStageIndex(stage) {
  return STAGE_ORDER.indexOf(stage ?? "reading");
}

function StageRow({ label, status }) {
  // status: 'done' | 'active' | 'pending'
  return (
    <li className="flex items-center gap-3">
      {/* Indicator */}
      <span
        aria-hidden="true"
        className={`
          flex-shrink-0 w-5 h-5 rounded-full
          flex items-center justify-center
          text-[10px] font-bold
          transition-all duration-300
          ${status === "done"
            ? "bg-white/10 text-white/70"
            : status === "active"
              ? "bg-white/[0.08] text-white/90 ring-1 ring-white/20 animate-pulse-subtle"
              : "bg-transparent text-white/20"
          }
        `}
      >
        {status === "done" ? "✓" : status === "active" ? "●" : "○"}
      </span>
      <span
        className={`text-sm transition-colors duration-300 ${
          status === "done"    ? "text-white/50 line-through"
          : status === "active"  ? "text-white/90"
          : "text-white/25"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export default function ResumeProcessing() {
  const { processingStage } = useResume();
  const currentIndex = getStageIndex(processingStage);

  const currentLabel = STAGES[currentIndex]?.label ?? "Processing...";

  return (
    <div className="max-w-md mx-auto dash-card-enter">
      <DashboardCard className="flex flex-col gap-6">
        {/* Indeterminate progress bar */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-white/90">Understanding your resume</h2>
          <p className="text-xs text-white/40">This may take a moment. Don't close this page.</p>
          {/* Animated progress bar — indeterminate (no fake percentage) */}
          <div className="mt-3 h-0.5 w-full rounded-full bg-white/[0.08] overflow-hidden" role="progressbar" aria-label="Processing resume">
            <div className="h-full bg-white/25 rounded-full animate-[indeterminate_1.8s_ease-in-out_infinite]" style={{ width: "40%" }} />
          </div>
        </div>

        {/* Stage list */}
        <ul
          className="flex flex-col gap-3"
          aria-live="polite"
          aria-label="Processing progress"
          aria-atomic="false"
        >
          {STAGES.map((stage, i) => (
            <StageRow
              key={stage.key}
              label={stage.label}
              status={
                i < currentIndex  ? "done"
                : i === currentIndex ? "active"
                : "pending"
              }
            />
          ))}
        </ul>

        {/* Screen-reader live announcement of current step */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {currentLabel}
        </p>
      </DashboardCard>
    </div>
  );
}
