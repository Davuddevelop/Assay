"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

const STEPS = [
  {
    n: "01",
    title: "Paste your link",
    body: "Drop in the URL of your live app. No install, no code to touch — Assay reads it the way the public does.",
  },
  {
    n: "02",
    title: "Watch it scan",
    body: "Assay fetches your app the way a browser does and checks it live, right in front of you — for exposed keys, an open database, and missing protections.",
  },
  {
    n: "03",
    title: "Get your report + fixes",
    body: "Every issue is explained in plain language — with the exact prompt to paste back into your builder. Clean apps earn the hallmark.",
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const inner = el.querySelector<HTMLElement>(".hiw-inner");
      const mm = gsap.matchMedia();

      // Desktop + motion allowed: a quick one-shot reveal as the section enters
      // view — the flow line fills, then the steps rise. No pin, no scrub, so
      // the page scrolls through it at normal speed.
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: inner, start: "top 75%", once: true },
          });
          tl.fromTo(
            ".hiw-fill",
            { scaleX: 0 },
            { scaleX: 1, ease: "power2.out", duration: 0.7 },
            0,
          )
            .from(
              [".hiw-step-0", ".hiw-step-1", ".hiw-step-2"],
              {
                autoAlpha: 0,
                y: 24,
                duration: 0.5,
                ease: "power3.out",
                stagger: 0.12,
              },
              0.15,
            );
        },
      );

      // Mobile or reduced-motion: show the line filled and the steps in place.
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        gsap.set(".hiw-fill", { scaleX: 1 });
        gsap.set([".hiw-step-0", ".hiw-step-1", ".hiw-step-2"], { autoAlpha: 1 });
      });
    },
    { scope: root },
  );

  return (
    <section id="how-it-works" ref={root} className="scroll-mt-16 edge-b">
      {/* Utility section — steps down from the display size the argument
          sections use, so the page has chapters instead of six equal blocks. */}
      <div className="hiw-inner mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 xl:max-w-7xl xl:py-20">
        <Reveal>
          <Eyebrow label="How it works" />
          <h2 className="mt-5 max-w-2xl font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ivory sm:text-[2rem] xl:text-[2.4rem]">
            Three steps, no code required.
          </h2>
        </Reveal>

        {/* Flow track that fills as you scroll (desktop). The nodes are gone:
            the step columns now carry their own dividers, so the dots were a
            second, competing rhythm drawn in the accent colour. */}
        <div className="relative mt-12 hidden h-px w-full bg-line md:block">
          <div className="hiw-fill absolute inset-y-0 left-0 w-full origin-left bg-border-strong" />
        </div>

        {/* Editorial columns, not cards.
            Four consecutive sections were grids of the same rounded surface
            with the same border, so the page read as card soup and nothing
            claimed priority. This is the lightest content on the page — three
            short sentences — and it was wearing the heaviest chrome: a panel,
            a spotlight, a hover lift and an icon chip each. A number, a rule
            and the text says the same thing and lets the sections that hold
            real evidence keep the cards. */}
        <ol className="mt-10 grid gap-y-10 md:grid-cols-3 md:gap-x-12">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className={`hiw-step-${i} border-t border-line pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0 md:first:border-l-0 md:first:pl-0`}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-[0.2em] text-ash">
                  {step.n}
                </span>
                <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-ivory">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory-dim">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
