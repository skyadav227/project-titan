/**
 * ResumePage
 *
 * State-driven orchestrator for the Resume Intelligence module.
 * Wrapped in DashboardLayout and ResumeProvider.
 *
 * UI state machine:
 *   loading          → skeleton while fetching initial backend state
 *   none             → empty state + dropzone
 *   selected         → file selected, ready to process
 *   uploading        → file being transferred
 *   processing       → AI pipeline running
 *   ready_for_review → processed, needs user confirmation
 *   active           → confirmed active resume, full profile shown
 *   failed           → upload or processing error
 */
import DashboardLayout from "../layouts/DashboardLayout";
import { ResumeProvider, useResume } from "../contexts/ResumeContext";
import SkeletonLoader from "../components/dashboard/ui/SkeletonLoader";

// Resume state components
import ResumeEmptyState   from "../components/resume/ResumeEmptyState";
import ResumeSelectedFile from "../components/resume/ResumeSelectedFile";
import ResumeProcessing   from "../components/resume/ResumeProcessing";
import ResumeErrorState   from "../components/resume/ResumeErrorState";
import ResumeReview       from "../components/resume/ResumeReview";
import ResumeProfile      from "../components/resume/ResumeProfile";
import ResumeDropzone     from "../components/resume/ResumeDropzone";
import DashboardCard      from "../components/dashboard/ui/DashboardCard";
import Button             from "../components/ui/Button";
import { useResume as useResumeHook } from "../contexts/ResumeContext";

// ── Uploading indicator ───────────────────────────────────────────────────────
function UploadingState() {
  return (
    <div className="max-w-md mx-auto dash-card-enter">
      <DashboardCard className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 animate-[spin_1.5s_linear_infinite]">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
        <div>
          <p
            className="text-sm font-medium text-white/80"
            aria-live="polite"
            aria-atomic="true"
          >
            Uploading your resume...
          </p>
          <p className="mt-1 text-xs text-white/35">Please keep this page open.</p>
        </div>
      </DashboardCard>
    </div>
  );
}

// ── Replacement banner (shown above dropzone when replacing) ──────────────────
function ReplacementBanner() {
  const { isReplacing, cancelReplacement, activeResume } = useResumeHook();
  if (!isReplacing || !activeResume) return null;

  return (
    <div className="max-w-xl mx-auto mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex items-center justify-between gap-4 dash-card-enter" role="status">
      <div>
        <p className="text-xs font-medium text-white/70">
          Your current resume will remain active until the new one is processed and confirmed.
        </p>
        <p className="text-xs text-white/35 mt-0.5">
          Your previous resume will remain available for historical interview context.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={cancelReplacement} className="flex-shrink-0">
        Cancel
      </Button>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
function PageHeader() {
  const { uiState } = useResumeHook();
  const hasResume = uiState === "active";

  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-white tracking-tight">Resume Intelligence</h1>
      <p className="mt-1 text-sm text-white/45">
        {hasResume
          ? "Your active resume powers personalized interviews and recommendations."
          : "Your resume helps TITAN understand your skills, experience, and projects."
        }
      </p>
    </div>
  );
}

// ── Skeleton loading ──────────────────────────────────────────────────────────
function ResumeSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <SkeletonLoader card className="h-[120px]" />
      <SkeletonLoader card className="h-[80px]" />
      <SkeletonLoader card className="h-[200px]" />
    </div>
  );
}

// ── Main content switcher ─────────────────────────────────────────────────────
function ResumeContent() {
  const { uiState, isReplacing } = useResume();

  if (uiState === "loading") return <ResumeSkeleton />;

  return (
    <>
      <PageHeader />

      {/* Replacement context banner */}
      {isReplacing && <ReplacementBanner />}

      {/* State-driven content */}
      {uiState === "none"             && <ResumeEmptyState />}
      {uiState === "selected"         && <ResumeSelectedFile />}
      {uiState === "uploading"        && <UploadingState />}
      {uiState === "processing"       && <ResumeProcessing />}
      {uiState === "ready_for_review" && <ResumeReview />}
      {uiState === "active"           && <ResumeProfile />}
      {uiState === "failed"           && <ResumeErrorState />}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResumePage() {
  return (
    <DashboardLayout>
        <ResumeContent />
    </DashboardLayout>
  );
}
