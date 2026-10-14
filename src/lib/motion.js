import { useSyncExternalStore } from "react";

const query = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

export const prefersReducedMotion = () => !!query?.matches;

export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => { query?.addEventListener("change", cb); return () => query?.removeEventListener("change", cb); },
    () => !!query?.matches,
    () => false,
  );
}

// Camera move duration that respects reduced motion.
export const flyDuration = (ms = 1400) => (prefersReducedMotion() ? 0 : ms);

const mq = (q) => (typeof window !== "undefined" ? window.matchMedia(q) : null);
const mobileQuery = mq("(max-width: 767px)");

export function useIsMobile() {
  return useSyncExternalStore(
    (cb) => { mobileQuery?.addEventListener("change", cb); return () => mobileQuery?.removeEventListener("change", cb); },
    () => !!mobileQuery?.matches,
    () => false,
  );
}
