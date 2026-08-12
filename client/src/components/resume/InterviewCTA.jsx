/**
 * InterviewCTA
 *
 * "Your interview profile is ready." — the natural next step after activation.
 * Does not implement interview logic — just links to /interview.
 */
import { Link } from "react-router-dom";
import DashboardCard from "../dashboard/ui/DashboardCard";

export default function InterviewCTA() {
  return (
    <DashboardCard enterIndex={9} className="border-white/[0.09]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/90">Your interview profile is ready.</p>
          <p className="mt-0.5 text-xs text-white/45">
            Practice with questions tailored to your experience.
          </p>
        </div>
        <Link
          to="/interview"
          className="
            flex-shrink-0 inline-flex items-center gap-2
            px-5 py-2.5 rounded-lg text-sm font-medium
            bg-white text-black
            hover:bg-white/90 transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
            dash-btn-press
          "
          aria-label="Start a personalized interview based on your resume"
        >
          Start Interview
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </DashboardCard>
  );
}
