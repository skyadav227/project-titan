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
 *   │ Recent Interviews│ Quick Actions│
 *   ├──────────────────┴──────────────┤
 *   │ Activity Timeline               │
 *   └─────────────────────────────────┘
 *
 *   First-Time variant replaces analytics sections
 *   with onboarding components (Checklist, Journey, Resume).
 */
import DashboardLayout from "../layouts/DashboardLayout";
import { useDashboard } from "../contexts/DashboardContext";

// Cards — Returning User
import PrimaryActionCard      from "../components/dashboard/cards/PrimaryActionCard";
import TodaysMissionCard      from "../components/dashboard/cards/TodaysMissionCard";
import PerformanceOverviewCard from "../components/dashboard/cards/PerformanceOverviewCard";
import AIMentorCard           from "../components/dashboard/cards/AIMentorCard";
import SkillsOverviewCard     from "../components/dashboard/cards/SkillsOverviewCard";
import RecentInterviewsCard   from "../components/dashboard/cards/RecentInterviewsCard";
import ActivityFeedCard       from "../components/dashboard/cards/ActivityFeedCard";
import QuickActionsCard       from "../components/dashboard/cards/QuickActionsCard";
import ResumeStatusCard       from "../components/dashboard/cards/ResumeStatusCard";

// Cards — First-Time User
import GettingStartedCard  from "../components/dashboard/cards/GettingStartedCard";
import InterviewJourneyCard from "../components/dashboard/cards/InterviewJourneyCard";

// Dev toggle (remove before production)
import DevStateToggle from "../components/dashboard/DevStateToggle";

function FirstTimeDashboard() {
  return (
    <div className="flex flex-col gap-5">

      {/* 1. Primary CTA — always largest, always first */}
      <PrimaryActionCard />

      {/* 2. Two-column row: Checklist + AI Mentor (onboarding) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GettingStartedCard />
        <AIMentorCard />
      </div>

      {/* 3. Two-column row: Resume + Interview Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ResumeStatusCard />
        <InterviewJourneyCard />
      </div>

      {/* 4. Quick Actions */}
      <QuickActionsCard />

    </div>
  );
}

function ReturningDashboard() {
  return (
    <div className="flex flex-col gap-5">

      {/* 1. Primary CTA — always largest, always first */}
      <PrimaryActionCard />

      {/* 2. Two-column row: Today's Focus + Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodaysMissionCard />
        <PerformanceOverviewCard />
      </div>

      {/* 3. Two-column row: AI Mentor + Skills Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AIMentorCard />
        <SkillsOverviewCard />
      </div>

      {/* 4. Two-column row: Recent Interviews + (Resume + Quick Actions stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentInterviewsCard />
        <div className="flex flex-col gap-5 min-h-0">
          <ResumeStatusCard />
          <QuickActionsCard />
        </div>
      </div>

      {/* 5. Activity Timeline — full width */}
      <ActivityFeedCard />

    </div>
  );
}

function DashboardContent() {
  const { isFirstTimeUser } = useDashboard();
  return isFirstTimeUser ? <FirstTimeDashboard /> : <ReturningDashboard />;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
      <DevStateToggle />
    </DashboardLayout>
  );
}
