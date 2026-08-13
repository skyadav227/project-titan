/**
 * ResumeStatusCard
 *
 * Shows resume status from ResumeContext.
 *
 * ResumeContext is the single source of truth for resume state/data
 * across the frontend. This component does not make its own API call.
 *
 * States:
 *   loading           — skeleton while ResumeContext restores backend state
 *   none              — no resume exists
 *   processing        — resume is being processed
 *   ready_for_review  — processing finished, waiting for user activation
 *   active            — active resume
 *   failed            — processing failed
 *
 * Per spec: no match score in V1.
 * The card does not show fabricated data.
 */

import { Link } from "react-router-dom";
import DashboardCard from "../ui/DashboardCard";
import SectionLabel from "../ui/SectionLabel";
import EmptyState from "../ui/EmptyState";
import SkeletonLoader from "../ui/SkeletonLoader";
import { IconResume, IconUpload } from "../ui/DashboardIcons";
import { useResume } from "../../../contexts/ResumeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Shared Header ────────────────────────────────────────────────────────────

function ResumeHeader({ statusLabel, showStatus = false }) {
  return (
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
          <h2 className="text-sm font-semibold text-white">
            Resume Status
          </h2>
        </div>
      </div>

      {showStatus && (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-[10px] font-semibold text-white/60">
          <span
            className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-subtle"
            aria-hidden="true"
          />
          {statusLabel}
        </span>
      )}
    </div>
  );
}

// ─── No Resume ────────────────────────────────────────────────────────────────

function NoResumeState() {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={4}>
      <ResumeHeader />

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

// ─── Processing ───────────────────────────────────────────────────────────────

function ProcessingResumeState({ processingStage }) {
  const stageLabel = {
    reading: "Reading your resume...",
    extracting: "Extracting resume content...",
    parsing: "Analyzing your experience...",
    analyzing: "Building your interview profile...",
  };

  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={4}>
      <ResumeHeader statusLabel="Processing" showStatus />

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      <div className="flex flex-col gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
            <span
              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-white/75">
              {stageLabel[processingStage] || "Processing your resume..."}
            </p>

            <p className="text-xs text-white/30 mt-0.5">
              This may take a moment. You can stay on this page.
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/resume"
        className="text-xs text-white/35 hover:text-white/60 transition-colors duration-150 pt-1"
      >
        View resume processing
      </Link>
    </DashboardCard>
  );
}

// ─── Ready for Review ─────────────────────────────────────────────────────────

function ReadyForReviewState({ resume }) {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={4}>
      <ResumeHeader statusLabel="Ready" showStatus />

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      <div className="flex items-start gap-3">
        <div
          className="w-9 h-11 rounded-lg flex-shrink-0 border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-white/20"
          aria-hidden="true"
        >
          <IconResume className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <p
            className="text-sm text-white/75 truncate font-medium"
            title={resume?.fileName}
          >
            {resume?.fileName || "Resume ready"}
          </p> 

          <p className="text-xs text-white/30 mt-0.5">
            Your resume has finished processing.
          </p>
        </div>
      </div>

      <Link
        to="/resume"
        className="flex items-center justify-between text-xs text-white/35 hover:text-white/60 transition-colors duration-150 pt-1"
        aria-label="Review your resume"
      >
        Review & activate

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
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </DashboardCard>
  );
}

// ─── Failed ───────────────────────────────────────────────────────────────────

function FailedResumeState({ error }) {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={4}>
      <ResumeHeader statusLabel="Failed" showStatus />

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      <div className="flex flex-col gap-2 py-2">
        <p className="text-sm font-medium text-white/70">
          We couldn't process your resume.
        </p>

        <p className="text-xs text-white/30 leading-relaxed">
          {error?.message ||
            "Something went wrong while processing your resume."}
        </p>
      </div>

      <Link
        to="/resume"
        className="flex items-center justify-between text-xs text-white/35 hover:text-white/60 transition-colors duration-150 pt-1"
        aria-label="Retry resume processing"
      >
        View resume & retry

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
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </DashboardCard>
  );
}

// ─── Active Resume ────────────────────────────────────────────────────────────

function ActiveResumeState({ resume }) {
  return (
    <DashboardCard className="flex flex-col gap-4" enterIndex={5}>
      <ResumeHeader statusLabel="Active" showStatus />

      <div className="h-px bg-white/[0.05]" aria-hidden="true" />

      {/* File info */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-11 rounded-lg flex-shrink-0 border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-white/20"
          aria-hidden="true"
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <rect
              x="1"
              y="1"
              width="12"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M4 5h6M4 8h6M4 11h4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <p
            className="text-sm text-white/75 truncate font-medium"
            title={resume.fileName}
          >
            {resume.fileName}
          </p>

          <p className="text-xs text-white/30">
            {(resume.fileType || "").toUpperCase()} · Updated{" "}
            {formatDate(resume.updatedAt)}
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
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </DashboardCard>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ResumeStatusCard() {
  const {
    activeResume,
    resumeVersion,
    uiState,
    processingStage,
    error,
  } = useResume();

  // ResumeContext is restoring state from the backend.
  if (uiState === "loading") {
    return <SkeletonLoader card className="h-[180px]" />;
  }

  // No resume exists.
  if (uiState === "none") {
    return <NoResumeState />;
  }

  // Resume is currently being processed.
  if (
    uiState === "processing" ||
    uiState === "uploading"
  ) {
    return (
      <ProcessingResumeState
        processingStage={processingStage}
      />
    );
  }

  // Processing completed but user has not activated the version yet.
  if (uiState === "ready_for_review") {
    return (
      <ReadyForReviewState
        resume={resumeVersion}
      />
    );
  }

  // Processing failed.
  if (uiState === "failed") {
    return <FailedResumeState error={error} />;
  }

  // Active resume.
  if (uiState === "active" && activeResume) {
    return <ActiveResumeState resume={activeResume} />;
  }

  // Defensive fallback.
  return <NoResumeState />;
}

