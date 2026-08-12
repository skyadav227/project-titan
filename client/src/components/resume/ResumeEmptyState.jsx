/**
 * ResumeEmptyState
 *
 * Shown when the user has no active resume.
 * Doubles as the upload entry point — the dropzone is embedded here.
 * Per spec: "The empty state should also function as the primary upload
 * interaction rather than creating a separate competing upload interface."
 */
import DashboardCard from "../dashboard/ui/DashboardCard";
import ResumeDropzone from "./ResumeDropzone";

const BENEFITS = [
  {
    title: "Personalized Interviews",
    body:  "Questions tailored to your actual skills and experience.",
  },
  {
    title: "Resume-Aware Questions",
    body:  "TITAN can ask about your specific projects and stack.",
  },
  {
    title: "Smarter Feedback",
    body:  "Identify your strengths and areas for improvement.",
  },
];

export default function ResumeEmptyState() {
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 dash-card-enter">
      {/* Upload card */}
      <DashboardCard className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-base font-semibold text-white">Build your TITAN profile</h2>
          <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
            Upload your resume so TITAN can personalize your interviews
            around your actual skills, projects, and experience.
          </p>
        </div>
        <ResumeDropzone />
      </DashboardCard>

      {/* Benefit cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BENEFITS.map((b, i) => (
          <div
            key={b.title}
            className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 dash-card-enter dash-card-enter-${i + 1}`}
          >
            <p className="text-xs font-medium text-white/70">{b.title}</p>
            <p className="mt-1 text-xs text-white/35 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
