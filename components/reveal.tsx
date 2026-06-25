"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

const variants: Variants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0 },
};

type RevealProps = {
  children: React.ReactNode;
  /** Stagger the fade-up; milliseconds of delay. */
  delay?: number;
  as?: "div" | "li";
  className?: string;
};

/**
 * A quiet spring fade-up as the element scrolls into view, once. Honors
 * prefers-reduced-motion (renders static, no transform).
 */
export function Reveal({ children, delay = 0, as = "div", className }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    if (as === "li") return <li className={className}>{children}</li>;
    return <div className={className}>{children}</div>;
  }

  const M = as === "li" ? motion.li : motion.div;

  return (
    <M
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={variants}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </M>
  );
}
