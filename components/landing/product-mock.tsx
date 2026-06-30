"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { HallmarkStamp } from "@/components/hallmark-stamp";

const CHECKS = [
  { label: "Secrets", value: "None exposed" },
  { label: "Database", value: "RLS enforced" },
  { label: "Headers", value: "All present" },
];

/**
 * The product in a browser window. On view it "resolves": the three checks tick
 * in one by one, then the hallmark strikes — the app looks like it's running.
 */
export function ProductMock({ className }: { className?: string }) {
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
        tl.from(".pm-check", {
          autoAlpha: 0,
          y: 8,
          duration: 0.4,
          ease: "power3.out",
          stagger: 0.16,
          delay: 0.4,
        }).from(
          ".pm-stamp",
          { autoAlpha: 0, scale: 1.18, duration: 0.5, ease: "back.out(2)" },
          "+=0.1",
        );
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className={cn(
        "overflow-hidden rounded-[var(--radius-frame)] border border-border bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {/* browser chrome */}
      <div className="flex items-center gap-4 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
        </div>
        <div className="flex h-7 flex-1 items-center justify-center rounded-pill bg-onyx/60 px-4 font-mono text-xs text-ash">
          assay.dev/report/my-saas.lovable.app
        </div>
      </div>

      {/* body */}
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              Scan · my-saas.lovable.app
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-ivory">
              Safe to publish
            </h3>
          </div>
          {/* the hallmark strikes once the checks resolve */}
          <span className="pm-stamp">
            <HallmarkStamp state="assayed" animate={false} />
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {CHECKS.map((c) => (
            <div
              key={c.label}
              className="pm-check rounded-[var(--radius-control)] border border-line bg-onyx/40 px-3 py-3.5 sm:px-4"
            >
              <div className="flex items-center gap-1.5 text-iris-soft">
                <span aria-hidden className="text-xs leading-none">
                  ✓
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                  {c.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-ivory">{c.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ivory-dim">
          No critical or risky issues found. This app earned the hallmark.
        </p>
      </div>
    </div>
  );
}
