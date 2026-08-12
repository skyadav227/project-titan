/**
 * ResumeStatusCard
 *
 * Shows resume readiness.
 *
 * Per spec (Component Spec §7):
 *   First-Time User : Upload prompt + explanation
 *   Returning User  : Resume Uploaded, Last Updated, Resume Match %
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import { IconResume, IconUpload } from "../ui/DashboardIcons";

// ─── No resume uploaded ───────────────────────────────────────────────────────

function NoResumeState() {
  return (
    <DashboardCard className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/[0.08] bg-white/[0.03] text-white/30"
          aria-hidden="true"
        >
          <IconResume className="w-[18px] h-[18px]" />
        </div>
        <div>
          <SectionLabel>Resume</SectionLabel>
          <h2 className="text-sm font-semibold text-white">Resume Status</h2>
        </div>
      </div>

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      <EmptyState
        icon={<IconUpload className="w-5 h-5" />}
        message="Upload your resume to receive personalised interviews based on your actual experience."
        ctaLabel="Upload Resume"
        ctaRoute="/resume"
        className="py-4"
      />
    </DashboardCard>
  );
}

// ─── Resume uploaded ──────────────────────────────────────────────────────────

function ResumeUploadedState({ resume }) {
  const matchColor =
    resume.matchScore >= 80
      ? "text-emerald-400"
      : resume.matchScore >= 60
      ? "text-amber-400"
      : "text-red-400/80";

  const matchBg =
    resume.matchScore >= 80
      ? "bg-emerald-500/10 border-emerald-500/20"
      : resume.matchScore >= 60
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-red-500/10 border-red-500/20";

  return (
    <DashboardCard className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/[0.08] bg-white/[0.04] text-white/40"
            aria-hidden="true"
          >
            <IconResume className="w-[18px] h-[18px]" />
          </div>
          <div>
            <SectionLabel>Resume</SectionLabel>
            <h2 className="text-sm font-semibold text-white">Resume Status</h2>
          </div>
        </div>

        {/* Uploaded badge */}
        <span
          className="
            flex items-center gap-1.5
            px-2.5 py-1 rounded-full
            border border-emerald-500/25 bg-emerald-500/10
            text-[10px] font-semibold text-emerald-400
          "
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Uploaded
        </span>
      </div>

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* File info */}
      <div className="flex items-start gap-3">
        <div
          className="
            w-9 h-11 rounded-lg flex-shrink-0
            border border-white/[0.07] bg-white/[0.03]
            flex items-center justify-center
            text-white/20
          "
          aria-hidden="true"
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <rect x="1" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 5h6M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm text-white/70 truncate font-medium">
            {resume.fileName}
          </p>
          <p className="text-xs text-white/30">
            Updated{" "}
            {new Date(resume.lastUpdated).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Match score */}
      <div
        className={`
          flex items-center justify-between
          px-4 py-3 rounded-xl
          border ${matchBg}
        `}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-white/35">Role match score</span>
          <span className={`text-lg font-bold tabular-nums ${matchColor}`}>
            {resume.matchScore}%
          </span>
        </div>
        <Link
          to="/resume"
          className="
            text-xs text-white/35 hover:text-white/60
            transition-colors duration-150
            focus-visible:outline-none
          "
        >
          Update →
        </Link>
      </div>
    </DashboardCard>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ResumeStatusCard() {
  const { data, isFirstTimeUser } = useDashboard();
  const resume = data.resume;

  if (isFirstTimeUser || !resume?.uploaded) {
    return <NoResumeState />;
  }
  return <ResumeUploadedState resume={resume} />;
}
