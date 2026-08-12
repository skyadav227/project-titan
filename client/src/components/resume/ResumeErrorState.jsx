/**
 * ResumeErrorState
 *
 * Shown when upload or processing fails.
 * Provides actionable recovery paths.
 * Technical details are never shown to the user.
 */
import { useResume } from "../../contexts/ResumeContext";
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button from "../ui/Button";

const ERROR_COPY = {
  INVALID_FILE_TYPE: {
    title: "File type not supported",
    body:  "Please upload a PDF or DOCX file.",
  },
  FILE_TOO_LARGE: {
    title: "File too large",
    body:  "Your resume must be 5 MB or smaller.",
  },
  UPLOAD_FAILED: {
    title: "Upload couldn't be completed",
    body:  "Your resume could not be uploaded. Please try again.",
  },
  EXTRACTION_FAILED: {
    title: "We couldn't read this resume",
    body:  "Please try another file.",
  },
  PROCESSING_FAILED: {
    title: "We couldn't process this resume",
    body:  "Your file was uploaded, but TITAN couldn't extract the information successfully.",
  },
  AI_CONFIG_ERROR: {
    title: "AI service is not configured",
    body:  "Please contact support or check the server configuration.",
  },
  default: {
    title: "Something went wrong",
    body:  "Please try again.",
  },
};

export default function ResumeErrorState() {
  const { error, retryProcessing, chooseAnotherFile, pendingVersionId } = useResume();
  const code = error?.code || "default";
  const copy = ERROR_COPY[code] || ERROR_COPY.default;

  // Use the error message from the backend if available, otherwise use static copy
  const bodyText = error?.message || copy.body;

  const canRetry = !!pendingVersionId &&
    !["INVALID_FILE_TYPE", "FILE_TOO_LARGE", "UPLOAD_FAILED"].includes(code);

  return (
    <div className="max-w-md mx-auto dash-card-enter">
      <DashboardCard>
        <div className="flex flex-col gap-5">
          {/* Error icon */}
          <div className="w-10 h-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white/90">{copy.title}</h2>
            <p className="mt-1 text-sm text-white/50">{bodyText}</p>
          </div>

          <div className="flex flex-wrap gap-3" role="group" aria-label="Error recovery options">
            {canRetry && (
              <Button variant="primary" size="sm" onClick={retryProcessing}>
                Try Again
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={chooseAnotherFile}>
              {canRetry ? "Upload Different Resume" : "Choose Another File"}
            </Button>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
