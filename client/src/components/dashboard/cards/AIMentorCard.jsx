/**
 * AIMentorCard
 *
 * One of TITAN's defining features. Always visible.
 *
 * Per spec (Component Spec §5, UI Spec §13):
 *   - One recommendation
 *   - A reason for the recommendation
 *   - One clear CTA
 *   - Maximum 3 lines of text
 *   - Never overwhelm with paragraphs
 *   - Concise and actionable
 *
 * First-Time User: explanatory, friendly, explains how TITAN works
 * Returning User:  personalized, data-driven recommendation
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import { IconAI } from "../ui/DashboardIcons";

export default function AIMentorCard() {
  const { data, isFirstTimeUser } = useDashboard();
  const mentor = data.aiMentor;

  return (
    <DashboardCard className="flex flex-col gap-5" enterIndex={3} hoverable>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="
            w-9 h-9 rounded-xl flex-shrink-0
            flex items-center justify-center
            border border-white/[0.08] bg-white/[0.04]
            text-white/50
          "
          aria-hidden="true"
        >
          <IconAI className="w-[18px] h-[18px]" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <SectionLabel>AI Mentor</SectionLabel>
          <h2 className="text-sm font-semibold text-white leading-tight">
            {isFirstTimeUser ? "How TITAN works" : "Today's recommendation"}
          </h2>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* Recommendation */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-white/75 leading-relaxed">
          {mentor.recommendation}
        </p>

        {/* Reason — slightly muted */}
        <p className="text-xs text-white/35 leading-relaxed">
          {mentor.reason}
        </p>
      </div>

      {/* CTA */}

      {/* CTA — returning users only */}
      {!isFirstTimeUser && (
        <div className="mt-auto">
          <Link
            to={mentor.ctaRoute}
            className="
        inline-flex items-center gap-2
        px-4 py-2.5
        bg-white/[0.06] border border-white/[0.10]
        text-sm font-medium text-white/80
        rounded-xl
        hover:bg-white/[0.10] hover:border-white/[0.18] hover:text-white
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
      "
          >
            {mentor.ctaLabel}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6h8M6 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      )}


    </DashboardCard>
  );
}
