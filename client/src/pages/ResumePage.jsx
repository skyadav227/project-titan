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
import ResumeHistory      from "../components/resume/ResumeHistory";
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

// ── Restore error (both API calls failed — show retry, not upload screen) ─────
function RestoreError({ error, onRetry }) {
  return (
    <div className="max-w-md mx-auto dash-card-enter">
      <DashboardCard className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="w-12 h-12 rounded-xl border border-yellow-500/20 bg-yellow-500/10 flex items-center justify-center" aria-hidden="true">
          <svg className="w-5 h-5 text-yellow-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">
            {error?.message || "Couldn't load your resume."}
          </p>
          <p className="mt-1 text-xs text-white/35">
            Your resume data is preserved on the server.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </DashboardCard>
    </div>
  );
}

// ── Restore warning (one API call failed — non-blocking banner) ───────────────
function RestoreWarning({ error }) {
  if (!error) return null;
  return (
    <div className="max-w-xl mx-auto mb-4 rounded-xl border border-yellow-500/15 bg-yellow-500/[0.03] px-4 py-2.5" role="status">
      <p className="text-xs text-yellow-400/60">
        {error.message}
      </p>
    </div>
  );
}

// ── Main content switcher ─────────────────────────────────────────────────────
function ResumeContent() {
  const { uiState, isReplacing, restoreError, retryRestore } = useResume();

  if (uiState === "loading") return <ResumeSkeleton />;

  // Both API calls failed — show dedicated restore error with retry button,
  // NOT the upload screen. The user may have a resume we can't reach.
  if (uiState === "none" && restoreError?.code === "RESTORE_FAILED") {
    return (
      <>
        <PageHeader />
        <RestoreError error={restoreError} onRetry={retryRestore} />
      </>
    );
  }

  return (
    <>
      <PageHeader />

      {/* Replacement context banner */}
      {isReplacing && <ReplacementBanner />}

      {/* Restore warning for partial failures (non-blocking — shown above content) */}
      {restoreError && <RestoreWarning error={restoreError} />}

      {/* State-driven content */}
      {uiState === "none"             && <ResumeEmptyState />}
      {uiState === "selected"         && <ResumeSelectedFile />}
      {uiState === "uploading"        && <UploadingState />}
      {uiState === "processing"       && <ResumeProcessing />}
      {uiState === "ready_for_review" && <ResumeReview />}
      {uiState === "active"           && <ResumeProfile />}
      {uiState === "failed"           && <ResumeErrorState />}

      {/* Resume version history (shown when 2+ versions exist) */}
      {uiState !== "loading" && <ResumeHistory />}
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
