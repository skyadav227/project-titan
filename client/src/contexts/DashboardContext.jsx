/**
 * DashboardContext
 *
 * Provides real dashboard data to all dashboard components.
 *
 * Data sources (in order of precedence):
 *   1. AuthContext         → user identity (name, email, createdAt)
 *   2. ResumeContext       → resume status (already consumed by ResumeStatusCard directly)
 *   3. GET /api/dashboard/stats → all interview-derived stats, performance, history, etc.
 *
 * The mock-data import has been removed.
 * Every field now comes from the backend or is explicitly null / empty.
 *
 * Public interface is preserved:
 *   useDashboard() returns { isFirstTimeUser, data, greeting, unreadCount }
 *
 * Loading states:
 *   - `loading === true`  while the API call is in flight
 *   - `error !== null`    if the API call failed
 *   - Components receive null/empty values during loading (skeletons cover them)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth }  from "./AuthContext";
import { getDashboardStats } from "../services/dashboardService";

const DashboardContext = createContext(null);

// ── Empty/initial state (shown while loading or on error) ─────────────────────
// All fields explicitly null or [] so cards render empty states
// rather than fabricated numbers.
const EMPTY_DATA = {
  user: {
    name:           "",
    email:          "",
    avatarInitials: "",
    joinedDate:     null,
  },
  stats: {
    interviewsCompleted:   0,
    totalSessions:         0,
    totalQuestionsAnswered:0,
    overallScore:          null,
    previousScore:         null,
    streak:                null,
    rank:                  null,
    totalUsers:            null,
    level:                 null,
    levelProgress:         null,
  },
  performance: {
    overall:       { score: null, delta: null },
    technical:     { score: null, delta: null },
    communication: { score: null, delta: null },
    clarity:       { score: null, delta: null },
  },
  recentInterviews: [],
  activityFeed:     [],
  todaysMissions:   [],
  aiMentor: {
    recommendation: "Complete your first interview to receive personalised recommendations.",
    reason:         "TITAN adapts its coaching to your actual performance data.",
    ctaLabel:       "Start Interview",
    ctaRoute:       "/interview/setup",
  },
  skills:        null,
  onboarding: {
    checklist: [
      { id: "resume",    label: "Upload your resume",            completed: false, route: "/resume"          },
      { id: "interview", label: "Complete your first interview", completed: false, route: "/interview/setup" },
      { id: "report",    label: "Review your first report",      completed: false, route: "/history"         },
    ],
  },
  notifications: [],
};

export function DashboardProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [stats,   setStats]   = useState(null);     // raw API response
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch dashboard stats once auth is ready ──────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("[DashboardContext] Failed to load stats:", err);
      setError(err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Don't fetch until auth has resolved (avoids a 401 on mount)
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, fetchStats]);

  // ── Greeting ──────────────────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5  && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // ── Derived: isFirstTimeUser ──────────────────────────────────────────────
  // Comes from the backend (totalSessions === 0); falls back to false
  // so the returning-user layout renders while data is loading.
  const isFirstTimeUser = stats ? stats.isFirstTimeUser : false;

  // ── Build the data object that cards consume ──────────────────────────────
  const data = useMemo(() => {
    const base = stats || EMPTY_DATA;

    // Derive avatar initials and joinedDate from real AuthContext user
    const avatarInitials = user?.name
      ? user.name
          .split(" ")
          .map(p => p[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()
      : "?";

    const dashboardUser = {
      name:           user?.name      || "",
      email:          user?.email     || "",
      avatarInitials,
      joinedDate:     user?.createdAt ? user.createdAt.slice(0, 10) : null,
    };

    // ── Onboarding checklist ─────────────────────────────────────────────────
    // hasResume comes directly from the backend (ResumeVersion.isActive query).
    // It is NOT derived from isFirstTimeUser — a user can have a resume with
    // zero interviews, or interviews with no resume.
    const hasResume    = stats?.hasResume === true;
    const hasInterview = (stats?.stats?.interviewsCompleted || 0) > 0;
    const hasReport    = (stats?.recentInterviews || []).some(i => i.score !== null);

    const onboardingChecklist = [
      { id: "resume",    label: "Upload your resume",            completed: hasResume,    route: "/resume"          },
      { id: "interview", label: "Complete your first interview", completed: hasInterview, route: "/interview/setup" },
      { id: "report",    label: "Review your first report",      completed: hasReport,    route: "/history"         },
    ];

    return {
      user: dashboardUser,
      stats:            base.stats,
      performance:      base.performance,
      recentInterviews: base.recentInterviews,
      activityFeed:     base.activityFeed,
      todaysMissions:   base.todaysMissions,
      aiMentor:         base.aiMentor,
      skills:           base.skills ?? null,
      notifications:    [],    // V1: no backend notifications; empty array renders "all caught up"
      onboarding: {
        checklist: onboardingChecklist,
      },
    };
  }, [stats, user]);

  // ── Notification count ────────────────────────────────────────────────────
  const unreadCount = 0; // V1: no notification backend

  const value = useMemo(
    () => ({
      isFirstTimeUser,
      // setIsFirstTimeUser kept for DevStateToggle compatibility
      setIsFirstTimeUser: () => {},  // noop — now derived from real data
      data,
      greeting,
      unreadCount,
      loading,
      error,
      refetch: fetchStats,
    }),
    [isFirstTimeUser, data, greeting, unreadCount, loading, error, fetchStats]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}
