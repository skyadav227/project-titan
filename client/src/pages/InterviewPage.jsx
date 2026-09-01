/**
 * InterviewPage
 *
 * Root page for the Interview Intelligence module.
 * Wrapped in DashboardLayout. Reads the URL to determine whether we're on
 * /interview/setup or /interview/session/:id, then delegates to the
 * correct component based on InterviewContext.uiState.
 *
 * NAVIGATION GUARD
 * ─────────────────
 * When the user is mid-session (isInterviewOngoing) at /interview/session/:id,
 * navigating away shows a "Leave interview?" confirmation modal.
 *
 * Implementation note: TITAN uses BrowserRouter (non-data router), so
 * useBlocker from react-router-dom v7 is NOT available — it requires a data
 * router created with createBrowserRouter/RouterProvider. Instead we intercept
 * navigation through two complementary mechanisms:
 *
 *   1. Document click capture — catches all <Link> / <a> clicks that would
 *      navigate away from the interview subtree (/interview/*). When the guard
 *      is active we call e.preventDefault(), record the intended href, and show
 *      the modal. On "Leave" we call navigate(href) after abandoning.
 *
 *   2. popstate listener — catches the browser Back button. We push a sentinel
 *      history entry when the guard becomes active so the back press lands on
 *      the sentinel rather than actually leaving. On "Leave" we navigate(-1)
 *      after abandoning (which pops past the sentinel and the interview route).
 *
 * Neither mechanism requires a data router. Both are cleaned up on unmount.
 *
 * "Stay"  → discard pendingNavigation, restore history sentinel, resume.
 * "Leave" → finishInterview("user_ended") → backend: abandoned, no report
 *           → RESET context → navigate to the originally intended destination.
 *
 * GUARD IS INACTIVE when:
 *   - On /interview/setup (isSetupRoute)
 *   - isInterviewOngoing is false (idle, setup, report_ready, error)
 *   - Navigation is within the /interview/* subtree (progression is fine)
 *
 * HISTORICAL REPORT PROTECTION (previous fix — preserved)
 * ─────────────────────────────────────────────────────────
 * ReportPage calls restoreSession() with a cancel token so stale async
 * callbacks cannot overwrite the "setup" state that goToSetup() sets.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import DashboardLayout  from "../layouts/DashboardLayout";
import { useInterview } from "../contexts/InterviewContext";

import InterviewSetup   from "../components/interview/InterviewSetup";
import InterviewSession from "../components/interview/InterviewSession";
import SkeletonLoader   from "../components/dashboard/ui/SkeletonLoader";
import DashboardCard    from "../components/dashboard/ui/DashboardCard";
import Button           from "../components/ui/Button";

// ── Leave-interview confirmation modal ───────────────────────────────────────
function LeaveConfirmModal({ onStay, onLeave, isLeaving }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
    >
      <DashboardCard className="max-w-sm w-full mx-4 flex flex-col gap-5">
        <div>
          <p id="leave-modal-title" className="text-base font-semibold text-white">
            Leave interview?
          </p>
          <p className="text-sm text-white/45 mt-1.5 leading-relaxed">
            Your progress will be saved but the session will be marked as
            abandoned and no performance report will be generated.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={onStay}
            disabled={isLeaving}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            Stay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={onLeave}
            isLoading={isLeaving}
            disabled={isLeaving}
            className="text-red-400/70 hover:text-red-400"
          >
            Leave
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
}

// ── Page content ─────────────────────────────────────────────────────────────
function InterviewPageContent() {
  const { id: sessionId } = useParams();
  const location          = useLocation();
  const navigate          = useNavigate();
  const {
    uiState,
    isLoading,
    isInterviewOngoing,
    reportSessionId,
    restoreSession,
    goToSetup,
    finishInterview,
  } = useInterview();

  const isSetupRoute   = location.pathname.endsWith("/setup") || !sessionId;
  const isSessionRoute = Boolean(sessionId);

  // ── Navigation guard state ────────────────────────────────────────────────
  // pendingNavigation: the href the user tried to go to, or "back" for popstate
  const [isBlocked,         setIsBlocked]         = useState(false);
  const [pendingNavigation, setPendingNavigation]  = useState(null);
  const [isLeaving,         setIsLeaving]          = useState(false);

  // Track whether the guard pushed a sentinel history entry so we know
  // whether to call history.back() on "Stay" to restore position.
  const sentinelPushedRef = useRef(false);

  // ── Guard active? ─────────────────────────────────────────────────────────
  // Guard fires whenever an interview is actually in progress, regardless of
  // which URL path was used to enter the interview.
  //
  // isInterviewOngoing is already false for idle/setup/report_ready/error states,
  // so no additional route checks are needed. Specifically, do NOT gate on
  // isSessionRoute: a fresh interview starts at /interview/setup (URL never
  // changes to /interview/session/:id until the user navigates there), so
  // isSessionRoute would be false the entire time and the guard would never fire.
  const guardActive = isInterviewOngoing;

  // ── Effect: document-level click interceptor ──────────────────────────────
  // Captures clicks on any <a> element (React Router <Link> renders <a>).
  // When guardActive, prevents navigation to destinations outside /interview/*
  // and instead records the target and shows the modal.
  useEffect(() => {
    if (!guardActive) return;

    function handleClick(e) {
      // Walk up the DOM from the event target to find the nearest <a>
      let el = e.target;
      while (el && el.tagName !== "A") el = el.parentElement;
      if (!el || !el.href) return;

      let href;
      try {
        const url = new URL(el.href);
        // Only intercept same-origin navigations
        if (url.origin !== window.location.origin) return;
        href = url.pathname + url.search + url.hash;
      } catch {
        return;
      }

      // Allow navigation within the interview subtree
      if (href.startsWith("/interview/")) return;

      // Also allow the "End interview" button — it calls finishInterview directly,
      // it does not navigate via an <a> tag.
      // Intercept everything else
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setIsBlocked(true);
    }

    // Use capture phase so we intercept before React Router's own handler
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [guardActive]);

  // ── Effect: popstate interceptor (browser Back / Forward) ─────────────────
  // Push a sentinel entry so that the first Back press lands on the sentinel
  // instead of actually leaving. We then show the modal.
  useEffect(() => {
    if (!guardActive) {
      // If guard just became inactive (interview ended/abandoned), clean up
      // any lingering sentinel without restoring — navigation is already handled.
      sentinelPushedRef.current = false;
      return;
    }

    // Push sentinel so the back button doesn't immediately leave
    window.history.pushState({ interviewGuardSentinel: true }, "");
    sentinelPushedRef.current = true;

    function handlePopstate(e) {
      if (e.state?.interviewGuardSentinel) {
        // User pressed back and landed on the sentinel — show modal
        // Re-push so repeated back presses keep hitting us
        window.history.pushState({ interviewGuardSentinel: true }, "");
        setPendingNavigation("back");
        setIsBlocked(true);
      }
    }

    window.addEventListener("popstate", handlePopstate);
    return () => {
      window.removeEventListener("popstate", handlePopstate);
      // Clean up: if the sentinel is still in history (guard torn down without
      // the user leaving), go back once to remove it.
      if (sentinelPushedRef.current) {
        window.history.back();
        sentinelPushedRef.current = false;
      }
    };
  }, [guardActive]);

  // ── Modal: Stay ───────────────────────────────────────────────────────────
  const handleStay = useCallback(() => {
    setIsBlocked(false);
    setPendingNavigation(null);
  }, []);

  // ── Modal: Leave ──────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    const destination = pendingNavigation;

    // Clean up sentinel before abandoning so finishInterview's RESET+navigate
    // doesn't fight with the popstate handler.
    sentinelPushedRef.current = false;

    try {
      // Abandon the session: backend → status=abandoned, no report.
      // finishInterview("user_ended") dispatches RESET then SET_STATE("setup").
      await finishInterview("user_ended");
    } catch {
      // Even on failure, let the user leave.
    } finally {
      setIsLeaving(false);
      setIsBlocked(false);
      setPendingNavigation(null);
    }

    // Navigate to the originally intended destination.
    // finishInterview already RESET context and set uiState="setup"; if the
    // destination is /interview or /interview/setup that's fine — goToSetup()
    // will fire in the mount effect on the new route.
    if (destination === "back") {
      // For browser back: go back two steps — one past the re-pushed sentinel
      // and one past the original interview route.
      window.history.go(-2);
    } else if (destination) {
      navigate(destination);
    }
  }, [pendingNavigation, finishInterview, navigate]);

  // ── Effect 1: on mount — restore or reset based on route ─────────────────
  useEffect(() => {
    if (isSessionRoute && sessionId) {
      restoreSession(sessionId);
    } else if (isSetupRoute) {
      // Always reset — clears any stale report_ready/asking/etc. state.
      goToSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Effect 2: navigate to /history/:id when report is ready ──────────────
  // Fires when triggerReportGeneration sets report_ready + reportSessionId.
  // The isSetupRoute guard prevents this from misfiring on /interview/setup.
  useEffect(() => {
    if (isSetupRoute) return;

    if (uiState === "report_ready" && reportSessionId) {
      navigate(`/history/${reportSessionId}`, { replace: true });
    } else if (uiState === "report_ready" && sessionId) {
      navigate(`/history/${sessionId}`, { replace: true });
    }
  }, [uiState, reportSessionId, sessionId, navigate, isSetupRoute]);

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

  // ── report_ready: navigation handled by Effect 2 ─────────────────────────
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

  // ── Live interview session ────────────────────────────────────────────────
  return (
    <>
      {isBlocked && (
        <LeaveConfirmModal
          onStay={handleStay}
          onLeave={handleLeave}
          isLeaving={isLeaving}
        />
      )}
      <InterviewSession />
    </>
  );
}

export default function InterviewPage() {
  return (
    <DashboardLayout>
      <InterviewPageContent />
    </DashboardLayout>
  );
}
