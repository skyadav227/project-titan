/**
 * DashboardContext
 *
 * Provides all dashboard state and data to every dashboard component.
 * This is the single data layer for the dashboard — components never
 * import mock data directly; they consume this context.
 *
 * When the backend is ready, replace the mock imports with real API calls
 * inside this file. The rest of the application stays unchanged.
 *
 * The `isFirstTimeUser` flag controls which dashboard state is rendered.
 * Toggle it here (or eventually derive it from auth/user API response).
 */
import { createContext, useContext, useState } from "react";
import { firstTimeUserData, returningUserData } from "../data/dashboardMockData";

// ─── Context ─────────────────────────────────────────────────────────────────

const DashboardContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }) {
  /**
   * Toggle this to preview both dashboard states during development.
   * true  → First-Time User (onboarding experience)
   * false → Returning User  (improvement-focused experience)
   */
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // Select the correct data set based on user state
  const data = isFirstTimeUser ? firstTimeUserData : returningUserData;

  // Greeting — changes naturally throughout the day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)  return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Unread notification count
  const unreadCount = !isFirstTimeUser
    ? (data.notifications ?? []).filter((n) => !n.read).length
    : 0;

  const value = {
    isFirstTimeUser,
    setIsFirstTimeUser,   // exposed so a dev toggle can flip the state
    data,
    greeting: getGreeting(),
    unreadCount,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
