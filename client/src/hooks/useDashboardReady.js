/**
 * useDashboardReady
 *
 * Returns true once the dashboard data is ready to render.
 *
 * Previously used a fake 380ms delay.
 * Now reads from DashboardContext.loading — cards render their real
 * content (or correct empty states) as soon as the API responds.
 *
 * A minimum visual delay of 200ms is kept to prevent a flash of
 * un-animated content on very fast connections.
 */
import { useState, useEffect } from "react";
import { useDashboard } from "../contexts/DashboardContext";

const MIN_DISPLAY_MS = 200;

export function useDashboardReady() {
  const { loading } = useDashboard();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Ready when both the minimum delay has passed AND data has loaded
  return minElapsed && !loading;
}
