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
 *
 * IMPORTANT: report_ready state is handled by navigating to /reports/:sessionId.
 * MasterReport is never rendered inside InterviewPage — reports live in ReportPage.
 */
import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import DashboardLayout  from "../layouts/DashboardLayout";
import { useInterview } from "../contexts/InterviewContext";

import InterviewSetup   from "../components/interview/InterviewSetup";
import InterviewSession from "../components/interview/InterviewSession";
import SkeletonLoader   from "../components/dashboard/ui/SkeletonLoader";

function InterviewPageContent() {
  const { id: sessionId } = useParams();
  const location          = useLocation();
  const navigate          = useNavigate();
  const { uiState, isLoading, restoreSession, goToSetup, reportSessionId } = useInterview();

  const isSetupRoute   = location.pathname.endsWith("/setup") || !sessionId;
  const isSessionRoute = Boolean(sessionId);

  // ── On mount: determine initial state ────────────────────────────────────
  // For the setup route: ALWAYS call goToSetup() — this resets any stale
  // context state (including report_ready from a previous session) so the
  // setup form always appears cleanly.
  // For the session route: restore from backend.
  useEffect(() => {
    if (isSessionRoute && sessionId) {
      restoreSession(sessionId);
    } else if (isSetupRoute) {
      // Always reset — do NOT gate on uiState === "idle".
      // If we don't do this, stale report_ready/asking/etc. state causes
      // the report_ready guard below to redirect back to the old report.
      goToSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Guard: navigate to /history/:id when report is ready ────────────────
  // triggerReportGeneration sets reportSessionId; InterviewPage performs the
  // actual navigation here because useNavigate requires a Router ancestor.
  useEffect(() => {
    if (uiState === "report_ready" && reportSessionId) {
      navigate(`/history/${reportSessionId}`, { replace: true });
    } else if (uiState === "report_ready" && sessionId) {
      // Fallback: came via restoreSession on a completed/abandoned session URL
      navigate(`/history/${sessionId}`, { replace: true });
    }
  }, [uiState, reportSessionId, sessionId, navigate]);

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

  // ── report_ready: navigation handled above — show brief loading until redirect
  if (uiState === "report_ready") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <SkeletonLoader className="h-8 w-48 rounded-lg" />
        <SkeletonLoader className="h-40 rounded-2xl" />
      </div>
    );
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
