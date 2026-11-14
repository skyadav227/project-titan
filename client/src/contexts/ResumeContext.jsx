/**
 * ResumeContext
 *
 * Single state machine for Resume Intelligence.
 * All resume UI states and transitions live here.
 *
 * States: none | selected | uploading | processing | ready_for_review | active | failed
 *
 * On mount: fetches backend status to recover after page refresh.
 * During processing: polls GET /resumes/:id/status every 3 seconds.
 */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  getActiveResume,
  getLatestResume,
  getResumeById,
  getResumeStatus,
  uploadResume as apiUpload,
  activateResume as apiActivate,
  retryResume as apiRetry,
  deleteResume as apiDelete,
  getResumeHistory,
} from "../services/resumeService";

// ── Validation constants (mirrors server) ────────────────────────────────────
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTS = new Set([".pdf", ".docx"]);
const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const POLL_INTERVAL_MS = 3000;

// ── Context ───────────────────────────────────────────────────────────────────
const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [uiState, setUiState] = useState("loading");   // 'loading' while fetching initial status
  const [processingStage, setProcessingStage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [resumeVersion, setResumeVersion] = useState(null);        // current version being processed / active
  const [activeResume, setActiveResume] = useState(null);        // confirmed active version
  const [pendingVersionId, setPendingVersionId] = useState(null);        // version being polled
  const [error, setError] = useState(null);        // { code, message }
  const [isReplacing, setIsReplacing] = useState(false);       // replacement flow active
  const [restoreError, setRestoreError] = useState(null);     // API failure during restore (distinct from processing error)
  const restoreRequestIdRef = useRef(0);                      // prevents stale restore requests from overwriting newer state

  const [resumeHistory, setResumeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollRef = useRef(null);

  // ── Auth: re-restore on user change ────────────────────────────────────────
  const { user } = useAuth();

  // ── On mount and on user change: restore state from backend ────────────────
  useEffect(() => {
    if (user) {
      restoreFromBackend();
    } else {
      // User logged out — invalidate any in-flight restore requests by advancing
      // the request counter. Any restore call that started before logout will see
      // requestId !== restoreRequestIdRef.current and silently discard its result,
      // preventing the previous user's resume data from reappearing after logout.
      restoreRequestIdRef.current += 1;
      stopPolling();
      setResumeVersion(null);
      setActiveResume(null);
      setPendingVersionId(null);
      setProcessingStage(null);
      setError(null);
      setRestoreError(null);
      setUiState("none");
    }
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  async function restoreFromBackend() {
    // Use a request ID to prevent stale restore requests from overwriting
    // newer state (e.g., if the user logs in/out while a restore is in-flight).
    const requestId = ++restoreRequestIdRef.current;

    // Fetch active and latest independently so that one failure does NOT
    // discard the other's result. The previous implementation used Promise.all
    // which rejected entirely if either call failed, causing the user to see
    // "no resume" (uiState="none") even when their active resume was fine.
    let active = null, activeErr = null;
    let latest = null, latestErr = null;

    try { active = await getActiveResume(); } catch (e) { activeErr = e; }
    try { latest = await getLatestResume(); } catch (e) { latestErr = e; }

    // Fetch history in parallel (non-blocking — failure must not break the page)
    fetchHistory().catch(() => {});

    // Stale check — a newer restore request (user change, manual retry) superseded this one
    if (requestId !== restoreRequestIdRef.current) return;

    // ── Both requests failed — can't determine resume state ─────────────────
    if (activeErr && latestErr) {
      setRestoreError({
        code: "RESTORE_FAILED",
        message: "Couldn't reach the server. Your resume data is preserved — click retry to try again.",
      });
      // On initial mount (uiState still "loading"), transition to "none" so
      // the UI shows something instead of an infinite skeleton. The
      // restoreError flag lets a future UI change distinguish "no resume"
      // from "couldn't verify." On subsequent calls, preserve current state.
      setUiState(prev => prev === "loading" ? "none" : prev);
      return;
    }

    // At least one request succeeded — clear any prior restore error
    setRestoreError(null);

    // ── Determine the effective active resume ────────────────────────────────
    // If the active fetch succeeded, use it directly.
    // If it failed but the latest fetch succeeded AND latest has isActive=true,
    // we can recover the active resume from the latest endpoint.
    const effectiveActive = activeErr
      ? (latest?.isActive ? latest : null)
      : active;

    if (effectiveActive) {
      setActiveResume(effectiveActive);
      setResumeVersion(effectiveActive);
      setPendingVersionId(null);
      setProcessingStage(null);
      setError(null);
      setUiState("active");
      // If we recovered from latest because the active fetch failed, note it
      if (activeErr) {
        setRestoreError({
          code: "RESTORE_PARTIAL",
          message: "Couldn't verify your active resume status directly. Showing your latest confirmed resume.",
        });
      }
      // If latest fetch failed, warn that a newer version might exist — the user
      // may have uploaded a new resume from another device that we can't see.
      // activeErr and latestErr cannot both be set here (both-failed returns early).
      if (latestErr) {
        setRestoreError({
          code: "RESTORE_PARTIAL",
          message: "Couldn't check for newer resume versions. A newer upload may be processing.",
        });
      }
      return;
    }

    // ── No active resume (confirmed or inferred) ───────────────────────────────
    // Use latest to determine the current state if it's available
    if (!latestErr && latest) {
      setActiveResume(null);
      applyBackendState(latest);
      // If the active fetch failed, note the uncertainty — we might have an
      // active resume that we couldn't fetch
      if (activeErr) {
        setRestoreError({
          code: "RESTORE_PARTIAL",
          message: "Couldn't verify your active resume status. Showing your latest upload.",
        });
      }
      return;
    }

    // ── No active, no latest (or latest failed) ────────────────────────────────
    setResumeVersion(null);
    setActiveResume(null);
    setPendingVersionId(null);
    setError(null);
    setUiState("none");

    if (latestErr) {
      // Active was confirmed null but we couldn't check latest — the latest
      // endpoint may contain a processing, failed, or ready-but-inactive version.
      // Show a restoration error with retry, not the empty upload screen.
      setRestoreError({
        code: "RESTORE_FAILED",
        message: "Couldn't fetch your latest resume version. You may have a resume that we can't display.",
      });
    } else if (activeErr) {
      // Latest confirmed null (no versions exist) but active fetch failed.
      // We have evidence of no resume, but active status is uncertain.
      setRestoreError({
        code: "RESTORE_PARTIAL",
        message: "Couldn't verify your active resume status.",
      });
    }
  }

  // ── Retry restore (exposed for UI to call on network failure) ──────────────
  const retryRestore = useCallback(async () => {
    setUiState("loading");
    await restoreFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── History fetch ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getResumeHistory();
      setResumeHistory(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore — history section shows inline error
    } finally {
      setHistoryLoading(false);
    }
  }, []);





  function applyBackendState(version) {
    // Guard: a deleted version must never be restored as an active UI state.
    // Treat it as though no eligible resume exists.
    if (version.deletedAt) {
      setResumeVersion(null);
      setActiveResume(null);
      setUiState("none");
      return;
    }

    setResumeVersion(version);

    if (version.status === "ready" && version.isActive) {
      setActiveResume(version);
      setUiState("active");
      return;
    }
    if (version.status === "ready" && !version.isActive) {
      setUiState("ready_for_review");
      return;
    }
    if (version.status === "processing" || version.status === "uploaded") {
      setProcessingStage(version.processingStage);
      setUiState("processing");
      setPendingVersionId(version.id);
      startPolling(version.id);
      return;
    }
    if (version.status === "failed") {
      setError({ code: "PROCESSING_FAILED", message: version.processingError || "We couldn't process this resume. Please try again." });
      setUiState("failed");
      return;
    }
    // Fallback
    setUiState("none");
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  function startPolling(versionId) {
    stopPolling();
    pollRef.current = setInterval(() => pollStatus(versionId), POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollStatus(versionId) {
    try {
      const data = await getResumeStatus(versionId);
      setProcessingStage(data.processingStage);

      if (data.status === "ready") {
        stopPolling();

        // Fetch the processed version to get candidateProfile/interviewContext.
        // It may not be active yet because the user must review and activate it.
        const full = await getResumeById(versionId);

        if (full && full.status === "ready") {
          setResumeVersion(full);

          if (full.isActive) {
            setActiveResume(full);
            setUiState("active");
          } else {
            setUiState("ready_for_review");
          }
        }

        return;
      }

      if (data.status === "failed") {
        stopPolling();
        setError({ code: "PROCESSING_FAILED", message: data.processingError || "We couldn't process this resume. Please try again." });
        setUiState("failed");
      }
    } catch {
      // Network blip — keep polling, don't crash
    }
  }

  // ── File selection & validation ────────────────────────────────────────────
  const selectFile = useCallback((file) => {
    setFileError(null);
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    const mime = file.type;

    if (!ACCEPTED_EXTS.has(ext) || !ACCEPTED_MIMES.has(mime)) {
      setFileError("This file type isn't supported. Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Your resume must be 5 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setUiState("selected");
  }, []);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
    setUiState(activeResume ? "active" : "none");
  }, [activeResume]);

  // ── Upload + kick off processing ──────────────────────────────────────────
  const processResume = useCallback(async () => {
    if (!selectedFile) return;
    setUiState("uploading");
    setError(null);

    try {
      const result = await apiUpload(selectedFile);
      const versionId = result.resumeVersionId;
      setPendingVersionId(versionId);
      setSelectedFile(null);
      setProcessingStage("reading");
      setUiState("processing");
      startPolling(versionId);
    } catch (err) {
      setError({ code: err.code || "UPLOAD_FAILED", message: err.message || "Your resume could not be uploaded. Please try again." });
      setUiState("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  // ── Activation ────────────────────────────────────────────────────────────
  const activateResumeFn = useCallback(async (versionId) => {
    try {
      const activated = await apiActivate(versionId);
      setActiveResume(activated);
      setResumeVersion(activated);
      setIsReplacing(false);
      setUiState("active");
      fetchHistory().catch(() => {});
    } catch (err) {
      setError({ code: err.code || "ACTIVATION_FAILED", message: err.message || "Something went wrong. Please try again." });
      // Only clear the review state if the version was deleted — not for
      // transient errors where a legitimate ready_for_review state should persist.
      if (err.code === "RESUME_DELETED") {
        setResumeVersion(null);
        setUiState("none");
      }
    }
  }, [fetchHistory]);

  // ── Replacement flow ──────────────────────────────────────────────────────
  const initiateReplacement = useCallback(() => {
    setIsReplacing(true);
    setSelectedFile(null);
    setFileError(null);
    setUiState("none");    // show the dropzone again
  }, []);

  const cancelReplacement = useCallback(() => {
    setIsReplacing(false);
    setSelectedFile(null);
    setFileError(null);
    setUiState(activeResume ? "active" : "none");
  }, [activeResume]);

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retryProcessing = useCallback(async () => {
    if (!pendingVersionId) return;
    setError(null);
    setUiState("processing");
    setProcessingStage("reading");
    try {
      await apiRetry(pendingVersionId);
      startPolling(pendingVersionId);
    } catch (err) {
      setError({ code: err.code || "RETRY_FAILED", message: err.message || "Something went wrong. Please try again." });
      setUiState("failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVersionId]);

  const chooseAnotherFile = useCallback(() => {
    stopPolling();

    setPendingVersionId(null);
    setProcessingStage(null);
    setError(null);
    setSelectedFile(null);

    setResumeVersion(activeResume);
    setUiState(activeResume ? "active" : "none");

    if (activeResume) {
      setIsReplacing(true);
    }
  }, [activeResume]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteResumeFn = useCallback(async () => {
    if (!activeResume) return;
    try {
      await apiDelete(activeResume.id);
      setActiveResume(null);
      setResumeVersion(null);
      setIsReplacing(false);
      setUiState("none");
      fetchHistory().catch(() => {});
    } catch (err) {
      setError({ code: err.code || "DELETE_FAILED", message: err.message || "Something went wrong. Please try again." });
    }
  }, [activeResume, fetchHistory]);

  // ── Exposed value ─────────────────────────────────────────────────────────
  const value = {
    uiState,
    processingStage,
    selectedFile,
    fileError,
    resumeVersion,
    activeResume,
    error,
    isReplacing,
    restoreError,
    resumeHistory,
    historyLoading,
    // Actions
    selectFile,
    clearSelectedFile,
    processResume,
    activateResume: activateResumeFn,
    initiateReplacement,
    cancelReplacement,
    retryProcessing,
    chooseAnotherFile,
    deleteResume: deleteResumeFn,
    retryRestore,
    fetchHistory,
  };

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ");
  return ctx;
}
