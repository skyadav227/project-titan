/**
 * useDashboardReady
 *
 * Simulates an API loading state for the dashboard.
 * Returns `ready: true` after a short delay, triggering card content
 * to replace skeleton loaders.
 *
 * In production: replace this hook with your actual data-fetching
 * loading state (from React Query, SWR, Redux, etc.).
 *
 * Implementation notes:
 *   We track `readyKey` — the key value that the current `ready: true`
 *   was resolved for. If `readyKey !== key` the hook is still resolving,
 *   so we return false without a synchronous setState call inside the effect.
 *
 * The 380ms delay:
 *   - Long enough for the skeleton to register visually (prevents flash)
 *   - Short enough to feel instant (<400ms is perceived as near-instant)
 */
import { useState, useEffect } from "react";

const LOADING_DELAY_MS = 380;

export function useDashboardReady(key = null) {
  // `readyKey` tracks which key the resolved state belongs to
  const [readyKey, setReadyKey] = useState(/** @type {any} */(null));

  useEffect(() => {
    const timer = setTimeout(() => {
      setReadyKey(key);
    }, LOADING_DELAY_MS);

    return () => clearTimeout(timer);
  }, [key]);

  return readyKey === key;
}
