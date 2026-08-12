/**
 * ResumeStatusCard
 *
 * Shows real resume status from the backend via useActiveResume hook.
 * Phase 4: switched from mock data to real API.
 *
 * States:
 *   loading      — skeleton while fetching
 *   no resume    — upload prompt
 *   has resume   — filename, status, last updated, link to /resume
 *
 * Per spec: no match score in V1 (that is a future feature).
 * The card does not show fabricated data at any point.
 */
import { Link } from "react-router-dom";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel  from "../ui/SectionLabel";
import EmptyState    from "../ui/EmptyState";
import SkeletonLoader from "../ui/SkeletonLoader";
import { IconResume, IconUpload } from "../ui/DashboardIcons";
import { useActiveResume } from "../../../hooks/useActiveResume";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── No resume ────────────────────────────────────────────────────────────────
function NoResumeState() {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={4}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/[0.08] bg-white/[0.03] text-white/30" aria-hidden="true">
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
        message="Upload your resume to receive personalized interviews based on your actual experience."
        ctaLabel="Upload Resume"
        ctaRoute="/resume"
        className="py-4"
      />
    </DashboardCard>
  );
}

// ─── Has active resume ────────────────────────────────────────────────────────
function ActiveResumeState({ resume }) {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={5}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border border-white/[0.08] bg-white/[0.04] text-white/40" aria-hidden="true">
            <IconResume className="w-[18px] h-[18px]" />
          </div>
          <div>
            <SectionLabel>Resume</SectionLabel>
            <h2 className="text-sm font-semibold text-white">Resume Status</h2>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-semibold text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-subtle" aria-hidden="true" />
          Active
        </span>
      </div>

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* File info */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-11 rounded-lg flex-shrink-0 border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-white/20" aria-hidden="true">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <rect x="1" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 5h6M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm text-white/75 truncate font-medium" title={resume.fileName}>
            {resume.fileName}
          </p>
          <p className="text-xs text-white/30">
            {(resume.fileType || "").toUpperCase()} · Updated {formatDate(resume.updatedAt)}
          </p>
        </div>
      </div>

      {/* Link to full resume page */}
      <Link
        to="/resume"
        className="flex items-center justify-between text-xs text-white/35 hover:text-white/60 transition-colors duration-150 pt-1 focus-visible:outline-none"
        aria-label="View your resume profile"
      >
        View full profile
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </DashboardCard>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function ResumeStatusCard() {
  const { activeResume, loading } = useActiveResume();

  if (loading) {
    return <SkeletonLoader card className="h-[180px]" />;
  }

  return activeResume ? (
    <ActiveResumeState resume={activeResume} />
  ) : (
    <NoResumeState />
  );
}
