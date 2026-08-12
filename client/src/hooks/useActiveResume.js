/**
 * useActiveResume
 *
 * Fetches the current user's active resume on mount.
 * Used by ResumeStatusCard so the dashboard reflects real data.
 * Independent of ResumeContext — this is a lightweight read-only hook.
 */
import { useState, useEffect } from "react";
import { getActiveResume } from "../services/resumeService";
import { getToken } from "../services/api";

export function useActiveResume() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if the user has a token
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getActiveResume()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { activeResume: data, loading };
}
