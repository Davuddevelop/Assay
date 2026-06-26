"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";

/** Counts up to `to` once it scrolls into view. Static under reduced-motion. */
export function CountUp({
  to,
  duration = 1.1,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { v: 0 };
        el.textContent = "0";
        gsap.to(counter, {
          v: to,
          duration,
          ease: "power2.out",
          snap: { v: 1 },
          onUpdate: () => {
            el.textContent = String(counter.v);
          },
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    },
    { scope: ref, dependencies: [to, duration] },
  );

  // Render the final value by default (correct under reduced-motion / no JS).
  return (
    <span ref={ref} className={className}>
      {to}
    </span>
  );
}
