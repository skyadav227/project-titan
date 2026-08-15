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
import {
  getActiveResume,
  getLatestResume,
  getResumeById,
  getResumeStatus,
  uploadResume as apiUpload,
  activateResume as apiActivate,
  retryResume as apiRetry,
  deleteResume as apiDelete,
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

  const pollRef = useRef(null);

  // ── On mount: restore state from backend ──────────────────────────────────
  useEffect(() => {
    restoreFromBackend();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function restoreFromBackend() {
    try {
      const [latest, active] = await Promise.all([
        getLatestResume(),
        getActiveResume(),
      ]);

      // ─────────────────────────────────────────────────────────────────────
      // No resume exists at all.
      // ─────────────────────────────────────────────────────────────────────
      if (!latest && !active) {
        setResumeVersion(null);
        setActiveResume(null);
        setPendingVersionId(null);
        setError(null);
        setUiState("none");
        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Always restore the confirmed active resume.
      //
      // IMPORTANT:
      // A newer failed/processing version must NEVER replace the active
      // resume in the UI.
      // ─────────────────────────────────────────────────────────────────────
      if (active) {
        setActiveResume(active);
      } else {
        setActiveResume(null);
      }

      // ─────────────────────────────────────────────────────────────────────
      // If an active resume exists, it is the primary resume state.
      //
      // The latest version may be:
      //   - processing
      //   - failed
      //   - ready_for_review
      //
      // but it must not hijack the active resume.
      // ─────────────────────────────────────────────────────────────────────
      if (active) {
        setResumeVersion(active);
        setPendingVersionId(null);
        setProcessingStage(null);
        setError(null);
        setUiState("active");
        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // No active resume exists.
      //
      // Therefore the latest version legitimately determines the current
      // Resume Intelligence state.
      // ─────────────────────────────────────────────────────────────────────
      if (latest) {
        applyBackendState(latest);
        return;
      }

      // Defensive fallback.
      setResumeVersion(null);
      setUiState("none");
    } catch {
      // If restoring fails, don't crash the dashboard.
      setUiState("none");
    }
  }





  function applyBackendState(version) {
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
    } catch (err) {
      setError({ code: err.code || "ACTIVATION_FAILED", message: err.message || "Something went wrong. Please try again." });
    }
  }, []);

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
    } catch (err) {
      setError({ code: err.code || "DELETE_FAILED", message: err.message || "Something went wrong. Please try again." });
    }
  }, [activeResume]);

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
  };

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ");
  return ctx;
}
