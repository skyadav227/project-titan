/**
 * useInView
 *
 * Returns a [ref, isInView] tuple.
 * `isInView` becomes true once the element enters the viewport.
 * Uses IntersectionObserver — no scroll listeners needed.
 *
 * Once triggered, it stays true (does not re-trigger on scroll out).
 * This is the correct behaviour for entrance animations: they should
 * fire once and not repeat on re-scroll.
 *
 * Usage:
 *   const [ref, isInView] = useInView();
 *   <div ref={ref} className={isInView ? "dash-bar-fill" : ""} />
 *
 * Options:
 *   threshold : number  — 0–1, how much of the element must be visible (default: 0.15)
 *   rootMargin: string  — IntersectionObserver rootMargin (default: "0px")
 */
import { useState, useEffect, useRef } from "react";

export function useInView({ threshold = 0.15, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // fire once
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, isInView];
}
