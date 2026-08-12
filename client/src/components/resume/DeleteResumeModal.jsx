/**
 * DeleteResumeModal
 *
 * Confirmation dialog before deleting an active resume.
 * Uses focus trap pattern: focus enters modal on open, returns to trigger on close.
 * Deletion behavior: soft-delete on backend, historical data preserved.
 */
import { useEffect, useRef } from "react";
import { useResume } from "../../contexts/ResumeContext";
import Button from "../ui/Button";

export default function DeleteResumeModal({ onClose }) {
  const { deleteResume } = useResume();
  const cancelRef = useRef(null);

  // Focus the Cancel button when modal opens
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleDelete() {
    await deleteResume();
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111111] p-6 flex flex-col gap-5 auth-card-enter">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        <div>
          <h2 id="delete-modal-title" className="text-sm font-semibold text-white/90">Delete resume?</h2>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            This will remove your resume from your active profile.
          </p>
          <p className="mt-2 text-xs text-white/35 leading-relaxed">
            Historical interview records will remain available and retain the resume context
            used during those interviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" ref={cancelRef} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="!bg-red-500/80 !text-white hover:!bg-red-500"
            onClick={handleDelete}
          >
            Delete Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
