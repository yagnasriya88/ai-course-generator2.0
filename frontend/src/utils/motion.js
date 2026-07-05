import { useReducedMotion } from "framer-motion"

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const STILL_FADE = { hidden: { opacity: 1 }, visible: { opacity: 1 } }
const STILL_STAGGER = { hidden: {}, visible: {} }

// Page-level entrance animations (fadeInUp/staggerContainer) are purely
// decorative motion, not state changes — swap them for a no-op variant when
// the user prefers reduced motion instead of forcing every page transition.
export function usePageMotion() {
  const reduce = useReducedMotion()
  return {
    fadeInUp: reduce ? STILL_FADE : fadeInUp,
    staggerContainer: reduce ? STILL_STAGGER : staggerContainer,
  }
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
}

// Shared "pop in" spring for celebratory moments (reward/streak/course-complete
// modals and toasts) — consolidated here so new gamification UI stays consistent
// instead of re-inlining slightly different spring constants per component.
export const celebrationSpring = { type: "spring", stiffness: 300, damping: 22 }
