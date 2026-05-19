import { useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

export const springs = {
  press: { type: "spring", stiffness: 380, damping: 28, mass: 0.7 } as const,
  sheet: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 } as const,
  unfold: { type: "spring", stiffness: 180, damping: 22, mass: 1.1 } as const,
  fade: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const,
} satisfies Record<string, Transition>;

const instant: Transition = { duration: 0 };

export function useAppleMotion() {
  const reduced = useReducedMotion();
  if (reduced) {
    return {
      press: instant,
      sheet: instant,
      unfold: instant,
      fade: instant,
    };
  }
  return springs;
}
