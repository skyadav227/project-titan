/**
 * ExplanationPanel
 *
 * Displays a contextual concept explanation.
 * Per interview-ui-spec.md §33–34, interview-wireframe.md §39.
 *
 * Explanations come entirely from the backend — never fabricated here.
 */
import DashboardCard from "../dashboard/ui/DashboardCard";
import Button        from "../ui/Button";

export default function ExplanationPanel({ explanation, onContinue, isLoading }) {
  if (!explanation) return null;

  return (
    <div className="dash-card-enter" role="region" aria-label="Concept Explanation">
      <DashboardCard>
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.07] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
            <svg className="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Concept Explanation</p>
            <p className="text-base font-semibold text-white mt-0.5">{explanation.topic}</p>
          </div>
        </div>

        {/* Explanation text */}
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          {explanation.explanation}
        </p>

        {/* Key points */}
        {explanation.keyPoints?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">Key Points</p>
            <ul className="space-y-2">
              {explanation.keyPoints.map((kp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="text-white/25 flex-shrink-0 mt-0.5" aria-hidden="true">·</span>
                  {kp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Example */}
        {explanation.example && (
          <div className="mb-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-1.5">Example</p>
            <p className="text-sm text-white/55 italic">{explanation.example}</p>
          </div>
        )}

        {/* Interview tip */}
        {explanation.interviewTip && (
          <div className="mb-4 rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/25 mb-1.5">Interview Tip</p>
            <p className="text-sm text-white/50">{explanation.interviewTip}</p>
          </div>
        )}

        {/* Continue */}
        <Button
          variant="primary"
          fullWidth
          onClick={onContinue}
          isLoading={isLoading}
          disabled={isLoading}
        >
          I understand — Continue
        </Button>
      </DashboardCard>
    </div>
  );
}
