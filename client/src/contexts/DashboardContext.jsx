/**
 * DashboardContext
 *
 * Provides all dashboard state and data to dashboard components.
 *
 * AuthContext is the source of truth for user identity.
 * ResumeContext is the source of truth for resume state.
 *
 * Dashboard-specific mock content remains in dashboardMockData.js
 * until the corresponding backend APIs are available.
 */

import { createContext, useContext, useMemo, useState } from "react";
import {
  firstTimeUserData,
  returningUserData,
} from "../data/dashboardMockData";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  /*
   * Temporary development toggle.
   *
   * We are keeping this until the interview backend exists.
   * At that point, isFirstTimeUser will be derived from real
   * user/interview history instead of being manually controlled.
   */
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const { user } = useAuth();

  // Select dashboard content based on the temporary state.
  const data = isFirstTimeUser
    ? firstTimeUserData
    : returningUserData;

  // Greeting — changes naturally throughout the day.
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";

    return "Good evening";
  };

  // Unread notification count.
  const unreadCount = !isFirstTimeUser
    ? (data.notifications ?? []).filter((n) => !n.read).length
    : 0;

  /*
   * Use the real authenticated user's identity.
   *
   * Mock dashboard data still supplies fallback values for fields
   * that are not yet available from the backend.
   */
  const dashboardUser = {
    ...data.user,

    name: user?.name ?? data.user.name,

    email: user?.email ?? data.user.email,

    avatarInitials:
      user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 3)
        .toUpperCase() ?? data.user.avatarInitials,

    joinedDate: user?.createdAt
      ? user.createdAt.slice(0, 10)
      : data.user.joinedDate,
  };

  const value = useMemo(
    () => ({
      isFirstTimeUser,
      setIsFirstTimeUser,

      data: {
        ...data,
        user: dashboardUser,
      },

      greeting: getGreeting(),
      unreadCount,
    }),
    [
      isFirstTimeUser,
      data,
      dashboardUser,
      unreadCount,
    ]
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

  if (!ctx) {
    throw new Error(
      "useDashboard must be used within a DashboardProvider"
    );
  }

  return ctx;
}