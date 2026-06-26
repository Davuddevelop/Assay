"use client";

import { motion, useScroll, useReducedMotion } from "motion/react";

/** A thin iris bar at the very top that fills with page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-[image:var(--gradient-gold)]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
