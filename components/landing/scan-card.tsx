"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { HallmarkStamp } from "@/components/hallmark-stamp";

/**
 * Clean-looking app config that gets assayed on scroll-in: a scan line sweeps
 * the code, the leaking line (a secret key shipped to the browser) lights up
 * red, and a "Held" mark strikes — showing "looks done, but leaks" concretely.
 * Renders in its resolved (red-flagged) state by default, so reduced-motion /
 * no-JS still tells the story.
 */
export function ScanCard() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
        });
        // scan line sweeps down (linear) while pulsing in and out
        tl.fromTo(
          ".sc-sweep",
          { y: -56, autoAlpha: 0 },
          { y: 240, duration: 1.15, ease: "none" },
          0,
        )
          .to(
            ".sc-sweep",
            { keyframes: { autoAlpha: [0, 1, 1, 0] }, duration: 1.15, ease: "none" },
            0,
          )
          // the leaking line lights up red as the sweep passes it
          .from(".sc-leak", { backgroundColor: "rgba(0,0,0,0)", duration: 0.4 }, 1.0)
          // the HELD mark strikes
          .from(
            ".sc-held",
            { autoAlpha: 0, scale: 0.9, duration: 0.45, ease: "back.out(2)" },
            1.2,
          );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="panel relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs text-ash">src/lib/supabase.js</span>
        <span className="sc-held">
          <HallmarkStamp state="held" animate={false} size="sm" />
        </span>
      </div>

      <div className="relative overflow-hidden">
        <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 text-ivory-dim">
          <div>
            <span className="text-iris-soft">export const</span> supabase ={" "}
            createClient(
          </div>
          <div>{'  "https://xyzcompany.supabase.co",'}</div>
          <div className="sc-leak -mx-2 rounded px-2 bg-[rgba(181,68,58,0.18)]">
            {'  "eyJhbGciOi…service_role…",'}{" "}
            <span className="text-oxblood-soft">{"// secret key in the browser"}</span>
          </div>
          <div>{");"}</div>
        </pre>

        <div
          aria-hidden
          className="sc-sweep pointer-events-none absolute inset-x-0 top-0 h-14 opacity-0 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--color-iris)_32%,transparent),transparent)]"
        />
      </div>
    </div>
  );
}
