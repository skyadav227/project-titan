/**
 * ResumeSelectedFile
 *
 * Shows the selected file before upload begins.
 * User can remove the file or proceed to processing.
 */
import { useResume } from "../../contexts/ResumeContext";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeSelectedFile() {
  const { selectedFile, clearSelectedFile, processResume } = useResume();
  if (!selectedFile) return null;

  const ext = selectedFile.name.split(".").pop().toUpperCase();

  return (
    <div className="max-w-xl mx-auto dash-card-enter">
      <DashboardCard>
        <div className="flex flex-col gap-5">
          {/* File info */}
          <div className="flex items-start gap-3">
            {/* File type badge */}
            <div className="flex-shrink-0 w-10 h-12 rounded-lg border border-white/[0.10] bg-white/[0.04] flex flex-col items-center justify-center gap-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-[9px] font-bold text-white/30 leading-none">{ext}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-white/90 truncate"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                {ext} document · {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelectedFile}
              aria-label="Remove selected file"
            >
              Remove
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={processResume}
              aria-label="Upload and process this resume"
            >
              Process Resume
            </Button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
