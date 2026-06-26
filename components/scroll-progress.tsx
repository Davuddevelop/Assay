"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";

/** A thin iris bar at the very top that fills with page scroll. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { autoAlpha: 1 });
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
          },
        );
      });
    },
    { scope: ref },
  );

  // Hidden by default → only the no-reduced-motion branch reveals it.
  return (
    <div
      ref={ref}
      aria-hidden
      className="invisible fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-[image:var(--gradient-gold)]"
    />
  );
}
