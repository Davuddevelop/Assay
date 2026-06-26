"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger the fade-up; milliseconds of delay. */
  delay?: number;
  as?: "div" | "li";
  className?: string;
};

/**
 * A quiet fade-up as the element scrolls into view, once. Built on GSAP +
 * ScrollTrigger. Renders visible by default, so under prefers-reduced-motion
 * (or before hydration) the content is simply shown — no flash, no dead end.
 */
export function Reveal({ children, delay = 0, as = "div", className }: RevealProps) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 18,
          duration: 0.6,
          ease: "power3.out",
          delay: delay / 1000,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    },
    { scope: ref },
  );

  if (as === "li") {
    return (
      <li ref={ref} className={className}>
        {children}
      </li>
    );
  }
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
