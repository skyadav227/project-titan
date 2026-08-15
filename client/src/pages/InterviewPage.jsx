/**
 * InterviewPage
 *
 * Root page for the Interview Intelligence module.
 * Wrapped in DashboardLayout. Reads the URL to determine whether we're on
 * /interview/setup or /interview/session/:id, then delegates to the
 * correct component based on InterviewContext.uiState.
 *
 * Per interview-ui-spec.md §5, interview-userflow.md §3.
 *
 * This component contains NO business logic — it only routes to the correct
 * UI component based on state from InterviewContext.
 */
import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

import DashboardLayout  from "../layouts/DashboardLayout";
import { useInterview } from "../contexts/InterviewContext";

import InterviewSetup   from "../components/interview/InterviewSetup";
import InterviewSession from "../components/interview/InterviewSession";
import MasterReport     from "../components/interview/MasterReport";
import SkeletonLoader   from "../components/dashboard/ui/SkeletonLoader";

function InterviewPageContent() {
  const { id: sessionId } = useParams();
  const location          = useLocation();
  const { uiState, isLoading, restoreSession, goToSetup } = useInterview();

  const isSetupRoute  = location.pathname.endsWith("/setup") || !sessionId;
  const isSessionRoute = Boolean(sessionId);

  // ── On mount: determine initial state ────────────────────────────────────
  useEffect(() => {
    if (isSessionRoute && sessionId) {
      // Restore active session from backend (handles page refresh recovery)
      restoreSession(sessionId);
    } else if (isSetupRoute && uiState === "idle") {
      goToSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (uiState === "idle" && isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SkeletonLoader className="h-8 w-48 rounded-lg" />
        <SkeletonLoader className="h-40 rounded-2xl" />
        <SkeletonLoader className="h-40 rounded-2xl" />
      </div>
    );
  }

  // ── Report ready ──────────────────────────────────────────────────────────
  if (uiState === "report_ready") {
    return <MasterReport />;
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (uiState === "setup" || uiState === "idle") {
    return <InterviewSetup />;
  }

  // ── Live interview session states ─────────────────────────────────────────
  // starting, asking, listening, retrying, processing, showing_report,
  // explaining, completing, error
  return <InterviewSession />;
}

export default function InterviewPage() {
  return (
    <DashboardLayout>
      <InterviewPageContent />
    </DashboardLayout>
  );
}
