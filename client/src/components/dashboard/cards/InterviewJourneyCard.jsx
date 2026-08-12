/**
 * InterviewJourneyCard
 *
 * First-Time User only. Simple visual timeline explaining the TITAN workflow.
 * Shown until the first interview is completed.
 *
 * Per spec (PRD §8, Component Spec §12):
 *   Flow: Resume → Interview → AI Analysis → Report → Improve
 */
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";

const STEPS = [
  {
    id: "resume",
    label: "Upload Resume",
    description: "TITAN reads your experience and builds a personalised question bank.",
  },
  {
    id: "interview",
    label: "Interview",
    description: "Realistic, adaptive AI interview tailored to your target role and stack.",
  },
  {
    id: "analysis",
    label: "AI Analysis",
    description: "Every answer is scored on technical accuracy, communication, and confidence.",
  },
  {
    id: "report",
    label: "Report",
    description: "Comprehensive breakdown of your performance with specific improvement areas.",
  },
  {
    id: "improve",
    label: "Improve",
    description: "AI Mentor tracks your progress and guides your next practice session.",
  },
];

export default function InterviewJourneyCard() {
  return (
    <DashboardCard>
      {/* Header */}
      <div className="flex flex-col gap-1 mb-5">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="text-base font-semibold text-white">Your Interview Journey</h2>
      </div>

      {/* Timeline */}
      <ol className="flex flex-col gap-0" aria-label="Interview preparation journey">
        {STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-4">
            {/* Step indicator + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Circle */}
              <div
                className="
                  w-7 h-7 rounded-full flex-shrink-0
                  flex items-center justify-center
                  border border-white/[0.12] bg-white/[0.04]
                  text-[11px] font-semibold text-white/40
                "
                aria-hidden="true"
              >
                {index + 1}
              </div>
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className="w-px flex-1 my-1 bg-white/[0.06]"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-0.5 pb-4 ${index === STEPS.length - 1 ? "" : ""}`}>
              <span className="text-sm font-medium text-white/75 leading-snug">
                {step.label}
              </span>
              <span className="text-xs text-white/35 leading-relaxed">
                {step.description}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </DashboardCard>
  );
}
