/**
 * useCountUp
 *
 * Smoothly animates a number from 0 to `target` over `duration` ms.
 * Uses requestAnimationFrame for smooth 60fps counting.
 *
 * Respects prefers-reduced-motion — initialises directly at `target` so
 * the number appears instantly without any animation.
 *
 * Usage:
 *   const count = useCountUp(74, 800);
 *   // count climbs from 0 → 74 over 800ms
 *
 * Pass `delay` (ms) to start the count after a short wait.
 * The hook restarts when `target` changes (handles the dev state toggle).
 */
import { useState, useEffect, useRef } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target, duration = 800, delay = 0) {
  // Initialise at `target` when reduced motion is preferred — no animation needed
  const [count, setCount] = useState(() =>
    prefersReducedMotion() ? target : 0
  );
  const rafRef      = useRef(null);
  const startRef    = useRef(null);

  useEffect(() => {
    // If reduced motion is preferred we stay at `target` — nothing to animate
    if (prefersReducedMotion()) {
      return;
    }

    const delayTimer = setTimeout(() => {
      // Reset for re-runs (e.g. dev toggle changes target)
      startRef.current = null;

      const animate = (timestamp) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed  = timestamp - startRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Re-run whenever target or duration change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return count;
}
