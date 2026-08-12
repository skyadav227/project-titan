import { useEffect, useRef } from "react";

/**
 * useScrollReveal
 * Attaches an IntersectionObserver to the returned ref.
 * When the element enters the viewport, the `visible` class is added,
 * triggering CSS-driven reveal animations defined in index.css.
 *
 * @param {object} options
 * @param {number}  options.threshold - 0–1, portion of element visible before triggering (default 0.12)
 * @param {string}  options.rootMargin - IntersectionObserver rootMargin (default "0px 0px -60px 0px")
 * @param {boolean} options.once      - only trigger once (default true)
 */
export function useScrollReveal({
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
  once = true,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    // Observe the root element
    observer.observe(el);

    // Also observe all direct children that have a reveal class
    const revealChildren = el.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale"
    );
    revealChildren.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}

/**
 * useInViewRef
 * Returns a ref. Calls `onEnter` once (or every time) the element enters the viewport.
 */
export function useInViewRef(onEnter, { threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && triggered.current) return;
            triggered.current = true;
            onEnter();
            if (once) observer.unobserve(el);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onEnter, threshold, once]);

  return ref;
}
