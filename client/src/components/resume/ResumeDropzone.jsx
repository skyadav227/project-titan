/**
 * ResumeDropzone
 *
 * Drag-and-drop + click-to-browse file upload zone.
 * Drag-and-drop is an enhancement — keyboard and click always work.
 * Wraps a visually-hidden <input type="file"> for accessibility.
 */
import { useRef, useState } from "react";
import { useResume } from "../../contexts/ResumeContext";

export default function ResumeDropzone() {
  const { selectFile, fileError } = useResume();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    if (files && files.length > 0) selectFile(files[0]);
  }

  function onDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() { setDragOver(false); }
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }
  function onChange(e) { handleFiles(e.target.files); }

  return (
    <div className="w-full">
      <label
        htmlFor="resume-file-input"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          group flex flex-col items-center justify-center gap-4
          w-full min-h-[200px] cursor-pointer
          rounded-2xl border-2 border-dashed
          transition-all duration-200
          ${dragOver
            ? "border-white/30 bg-white/[0.06]"
            : fileError
              ? "border-red-500/40 bg-red-500/[0.03]"
              : "border-white/[0.10] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          }
          focus-within:ring-2 focus-within:ring-white/30 focus-within:ring-offset-0
        `}
        aria-label="Upload resume: drag and drop or click to browse"
      >
        {/* Upload icon */}
        <div
          className={`
            w-12 h-12 rounded-xl border flex items-center justify-center
            transition-colors duration-200
            ${dragOver ? "border-white/20 bg-white/[0.08]" : "border-white/[0.08] bg-white/[0.04] group-hover:border-white/15"}
          `}
          aria-hidden="true"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        <div className="text-center px-4">
          <p className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">
            {dragOver ? "Drop your resume here" : "Drag & drop your resume here"}
          </p>
          <p className="mt-1 text-xs text-white/35">
            or <span className="text-white/55 underline underline-offset-2">browse files</span>
          </p>
          <p className="mt-2 text-xs text-white/25">PDF or DOCX · Maximum 5 MB</p>
        </div>

        {/* Visually hidden file input — accessible via keyboard */}
        <input
          ref={inputRef}
          id="resume-file-input"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onChange}
          className="sr-only"
          aria-label="Choose resume file"
        />
      </label>

      {/* Inline validation error */}
      {fileError && (
        <p
          role="alert"
          className="mt-2.5 text-xs text-red-400 flex items-start gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {fileError}
        </p>
      )}
    </div>
  );
}
