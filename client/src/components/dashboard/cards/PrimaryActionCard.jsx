/**
 * PrimaryActionCard
 *
 * The most important component on the dashboard — always the largest,
 * always first, always visible. Contains exactly ONE primary action.
 *
 * Per spec (Component Spec §2, UI Spec §11):
 *   - Must remain the largest card on the dashboard
 *   - Only ONE primary action — never competing CTAs
 *   - Visible always
 *
 * First-Time User : "Start Your First Interview"
 * Returning User  : "Continue Interview" or "Recommended Interview"
 */
import { Link } from "react-router-dom";
import { useDashboard } from "../../../contexts/DashboardContext";
import DashboardCard from "../ui/DashboardCard";
import { IconPlay, IconInterview } from "../ui/DashboardIcons";

// ─── First-Time variant ───────────────────────────────────────────────────────

function FirstTimeActionCard() {
  return (
    <DashboardCard className="relative overflow-hidden" enterIndex={1}>
      {/* Subtle background grid pattern — same as landing page */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 80% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left — text content */}
        <div className="flex flex-col gap-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className="
                inline-flex items-center gap-1.5
                px-2.5 py-1 rounded-full
                border border-white/[0.10] bg-white/[0.04]
                text-[10px] font-semibold uppercase tracking-wider text-white/50
              "
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden="true"
              />
              Ready to begin
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            Start your first interview
          </h2>

          <p className="text-sm text-white/45 leading-relaxed max-w-md">
            Your AI interviewer is ready. Choose a role, answer realistic questions,
            and receive a detailed performance report — all in under 30 minutes.
          </p>
        </div>

        {/* Right — CTA */}
        <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto">
          <Link
            to="/interview"
            className="
              inline-flex items-center justify-center gap-2.5
              px-6 py-3.5
              bg-white text-black
              text-sm font-semibold rounded-xl
              hover:bg-white/90
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
              active:scale-[0.98]
              hover:scale-[1.01]
              whitespace-nowrap
            "
          >
            <IconPlay className="w-4 h-4" />
            Start First Interview
          </Link>

          <p className="text-center text-xs text-white/25">
            No setup required · Free forever
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}

// ─── Returning User variant ───────────────────────────────────────────────────

function ReturningActionCard({ data }) {
  const lastInterview = data.recentInterviews?.[0];
  const performance = data.performance;

  return (
    <DashboardCard className="relative overflow-hidden" enterIndex={1}>
      {/* Subtle background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 90% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left */}
        <div className="flex flex-col gap-3">
          {/* Context line */}
          <div className="flex items-center gap-2 flex-wrap">
            {lastInterview && (
              <span className="text-xs text-white/35">
                Last:{" "}
                <span className="text-white/55">
                  {lastInterview.role}
                  {lastInterview.company ? ` @ ${lastInterview.company}` : ""}
                </span>
                {lastInterview.score !== null && (
                  <>
                    {" "}·{" "}
                    <span
                      className={
                        lastInterview.score >= 75
                          ? "text-emerald-400/80"
                          : "text-amber-400/80"
                      }
                    >
                      {lastInterview.score}/100
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            Continue preparing
          </h2>

          <p className="text-sm text-white/45 leading-relaxed max-w-md">
            {performance.overall.score !== null ? (
              <>
                Your overall score is{" "}
                <span className="text-white font-semibold">
                  {performance.overall.score}/100
                </span>
                .{" "}
                {performance.technical.delta !== null && performance.technical.delta > 0
                  ? `Technical improved +${performance.technical.delta} pts this week.`
                  : "Keep practising to improve your score."
                }
              </>
            ) : (
              "Complete an interview with a final report to see your performance overview."
            )}
          </p>
        </div>

        {/* Right — CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
          <Link
            to="/interview"
            className="
              inline-flex items-center justify-center gap-2.5
              px-6 py-3.5
              bg-white text-black
              text-sm font-semibold rounded-xl
              hover:bg-white/90
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
              active:scale-[0.98] hover:scale-[1.01]
              w-full sm:w-auto
            "
          >
            <IconInterview className="w-4 h-4" />
            Start Interview
          </Link>

          <Link
            to="/report"
            className="
              inline-flex items-center justify-center gap-2.5
              px-5 py-3.5
              border border-white/[0.12]
              text-white/70 text-sm font-medium rounded-xl
              hover:border-white/25 hover:text-white hover:bg-white/[0.04]
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
              w-full sm:w-auto
            "
          >
            View Last Report
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PrimaryActionCard() {
  const { isFirstTimeUser, data } = useDashboard();
  return isFirstTimeUser
    ? <FirstTimeActionCard />
    : <ReturningActionCard data={data} />;
}
