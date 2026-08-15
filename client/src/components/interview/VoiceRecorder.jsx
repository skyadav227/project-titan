/**
 * VoiceRecorder
 *
 * Handles microphone permission, audio recording, and upload.
 * Isolated from all presentation components — pure voice infrastructure.
 *
 * Per interview-architecture.md §23–24, interview-ui-spec.md §15–19.
 *
 * States exposed to parent:
 *   idle → requesting_permission → listening → stopped → error
 *
 * On stop: calls onRecordingComplete({ audioBlob, durationMs }).
 * Supports:
 *   - Manual stop (Finish Answer button)
 *   - Max duration auto-stop
 */
import { useState, useRef, useEffect, useCallback } from "react";

const MAX_RECORDING_MS = 3 * 60 * 1000; // 3 minutes max

// ── Prefer formats the browser and Whisper both handle well ──────────────────
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function getSupportedMimeType() {
  for (const mime of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return ""; // browser default
}

export default function VoiceRecorder({ onRecordingComplete, disabled = false }) {
  const [recState, setRecState] = useState("idle");
  // idle | requesting_permission | listening | stopped | error
  const [permissionError, setPermissionError] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const startTimeRef     = useRef(null);
  const timerRef         = useRef(null);
  const streamRef        = useRef(null);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAllTracks();
      clearInterval(timerRef.current);
    };
  }, []);

  function stopAllTracks() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (disabled) return;
    setPermissionError(null);
    setElapsedMs(0);
    chunksRef.current = [];
    setRecState("requesting_permission");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      const msg = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
        ? "Microphone access denied. Enable microphone permissions in your browser settings."
        : "Could not access your microphone. Check your device and try again.";
      setPermissionError(msg);
      setRecState("error");
      return;
    }

    streamRef.current = stream;
    const mimeType = getSupportedMimeType();
    const options  = mimeType ? { mimeType } : {};

    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch {
      setPermissionError("Recording is not supported in this browser. Try Chrome or Firefox.");
      setRecState("error");
      stopAllTracks();
      return;
    }

    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = () => {
      clearInterval(timerRef.current);
      stopAllTracks();

      const finalDurationMs = Date.now() - startTimeRef.current;
      const mimeUsed = mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeUsed });

      if (blob.size < 100) {
        // Empty recording
        setRecState("idle");
        return;
      }

      setRecState("stopped");
      onRecordingComplete({ audioBlob: blob, durationMs: finalDurationMs });
    };

    recorder.onerror = () => {
      clearInterval(timerRef.current);
      stopAllTracks();
      setPermissionError("Recording error. Please try again.");
      setRecState("error");
    };

    recorder.start(250); // collect data every 250ms
    startTimeRef.current = Date.now();
    setRecState("listening");

    // Elapsed timer
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_RECORDING_MS) stopRecording();
    }, 1000);
  }, [disabled, onRecordingComplete]);

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
  }, []);

  const retryPermission = useCallback(() => {
    setPermissionError(null);
    setRecState("idle");
  }, []);

  // ── Formatted timer ────────────────────────────────────────────────────────
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const minutes    = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const seconds    = String(elapsedSec % 60).padStart(2, "0");
  const timerLabel = `${minutes}:${seconds}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (recState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center">
          <MicIcon className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/80">Microphone unavailable</p>
          <p className="mt-1 text-xs text-white/35 max-w-xs">{permissionError}</p>
        </div>
        <button
          type="button"
          onClick={retryPermission}
          className="px-5 py-2 text-sm rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/25 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (recState === "listening") {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Animated listening indicator */}
        <div className="relative flex items-center justify-center" aria-label="Recording in progress">
          <div className="absolute w-20 h-20 rounded-full border border-white/10 animate-[ping_1.8s_ease_infinite]" />
          <div className="absolute w-16 h-16 rounded-full border border-white/15 animate-[ping_1.8s_ease_0.6s_infinite]" />
          <div className="relative w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse-subtle" aria-hidden="true" />
          </div>
        </div>

        <div className="text-center" aria-live="polite" aria-atomic="true">
          <p className="text-sm font-medium text-white/70">Listening</p>
          <p className="text-lg font-mono text-white/50 mt-1">{timerLabel}</p>
        </div>

        <button
          type="button"
          onClick={stopRecording}
          className="
            px-7 py-3 rounded-xl bg-white text-black text-sm font-semibold
            hover:bg-white/90 active:scale-95 transition-all
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
          "
        >
          Finish Answer
        </button>
      </div>
    );
  }

  if (recState === "requesting_permission") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center">
          <svg className="w-5 h-5 text-white/30 animate-[spin_1.5s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <p className="text-sm text-white/50">Requesting microphone access...</p>
      </div>
    );
  }

  // idle / stopped — show start button
  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        aria-label="Start recording your answer"
        className="
          group w-20 h-20 rounded-full
          border-2 border-white/20 bg-white/[0.05]
          hover:border-white/35 hover:bg-white/[0.08]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
        "
      >
        <MicIcon className="w-8 h-8 text-white/60 group-hover:text-white/80 transition-colors" />
      </button>
      <p className="text-sm text-white/40">
        {recState === "stopped" ? "Answer recorded" : "Tap to start your answer"}
      </p>
    </div>
  );
}

function MicIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}
