/**
 * DashboardPage
 *
 * The root page for the authenticated dashboard experience.
 * Wraps DashboardLayout and renders the correct content grid
 * based on user state (First-Time vs Returning).
 *
 * Layout grid — follows the wireframe exactly:
 *
 *   Desktop (≥1024px):
 *   ┌─────────────────────────────────┐
 *   │ Primary Action Card (full-width)│
 *   ├──────────────────┬──────────────┤
 *   │ Today's Focus    │ Performance  │
 *   ├──────────────────┼──────────────┤
 *   │ AI Mentor        │ Skills       │
 *   ├──────────────────┼──────────────┤
 *   │ Recent Interviews│ Resume+Quick │
 *   ├──────────────────┴──────────────┤
 *   │ Activity Timeline               │
 *   └─────────────────────────────────┘
 *
 * Milestone 5:
 *   - Dashboard content fades in via .dash-page-enter
 *   - Skeleton loading gate: cards render skeletons for ~380ms then
 *     reveal real content (simulates API load; replace with real state)
 */
import DashboardLayout from "../layouts/DashboardLayout";
import { useDashboard } from "../contexts/DashboardContext";
import { useDashboardReady } from "../hooks/useDashboardReady";
import SkeletonLoader from "../components/dashboard/ui/SkeletonLoader";

// Cards — Returning User
import PrimaryActionCard       from "../components/dashboard/cards/PrimaryActionCard";
import TodaysMissionCard       from "../components/dashboard/cards/TodaysMissionCard";
import PerformanceOverviewCard from "../components/dashboard/cards/PerformanceOverviewCard";
import AIMentorCard            from "../components/dashboard/cards/AIMentorCard";
import SkillsOverviewCard      from "../components/dashboard/cards/SkillsOverviewCard";
import RecentInterviewsCard    from "../components/dashboard/cards/RecentInterviewsCard";
import ActivityFeedCard        from "../components/dashboard/cards/ActivityFeedCard";
import QuickActionsCard        from "../components/dashboard/cards/QuickActionsCard";
import ResumeStatusCard        from "../components/dashboard/cards/ResumeStatusCard";

// Cards — First-Time User
import GettingStartedCard  from "../components/dashboard/cards/GettingStartedCard";
import InterviewJourneyCard from "../components/dashboard/cards/InterviewJourneyCard";

// ─── Skeleton placeholders ────────────────────────────────────────────────────
// Mirror the exact layout slots so there is zero content shift on load.

function DashboardSkeleton({ variant }) {
  return (
    <div className="flex flex-col gap-5 dash-page-enter">
      {/* Primary card — tall */}
      <SkeletonLoader card className="h-[148px]" />

      {/* Row 2 — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonLoader card className="h-[220px]" />
        <SkeletonLoader card className="h-[220px]" />
      </div>

      {/* Row 3 — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonLoader card className="h-[200px]" />
        <SkeletonLoader card className="h-[200px]" />
      </div>

      {variant === "returning" && (
        <>
          {/* Row 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonLoader card className="h-[260px]" />
            <div className="flex flex-col gap-5">
              <SkeletonLoader card className="h-[120px]" />
              <SkeletonLoader card className="h-[130px]" />
            </div>
          </div>

          {/* Row 5 — full width */}
          <SkeletonLoader card className="h-[180px]" />
        </>
      )}
    </div>
  );
}

// ─── First-Time layout ────────────────────────────────────────────────────────

function FirstTimeDashboard() {
  return (
    <div className="flex flex-col gap-5 dash-page-enter">
      <PrimaryActionCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GettingStartedCard />
        <AIMentorCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ResumeStatusCard />
        <InterviewJourneyCard />
      </div>

      <QuickActionsCard />
    </div>
  );
}

// ─── Returning User layout ────────────────────────────────────────────────────

function ReturningDashboard() {
  return (
    <div className="flex flex-col gap-5 dash-page-enter">
      <PrimaryActionCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodaysMissionCard />
        <PerformanceOverviewCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AIMentorCard />
        <SkillsOverviewCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentInterviewsCard />
        <div className="flex flex-col gap-5 min-h-0">
          <ResumeStatusCard />
          <QuickActionsCard />
        </div>
      </div>

      <ActivityFeedCard />
    </div>
  );
}

// ─── Root content with loading gate ──────────────────────────────────────────

function DashboardContent() {
  const { isFirstTimeUser } = useDashboard();
  const ready = useDashboardReady();

  if (!ready) {
    return (
      <DashboardSkeleton variant={isFirstTimeUser ? "firstTime" : "returning"} />
    );
  }

  return isFirstTimeUser ? <FirstTimeDashboard /> : <ReturningDashboard />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
