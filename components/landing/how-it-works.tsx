"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { SpotlightCard } from "@/components/spotlight-card";

const I = {
  connect: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M9.5 14.5 14.5 9.5M8.5 12.5 7 14a3 3 0 1 0 4.2 4.2l1.3-1.3M15.5 11.5 17 10a3 3 0 1 0-4.2-4.2l-1.3 1.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  scan: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-3.6-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  strike: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.2 12.3 10.8 14.8 15.8 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const STEPS = [
  {
    n: "01",
    icon: I.connect,
    title: "Connect your repo",
    body: "Sign in with GitHub and point Assay at a repository. No config to write — it reads your tests and your rules.",
  },
  {
    n: "02",
    icon: I.scan,
    title: "It checks every change",
    body: "On each push, Assay runs your test suite, a security scan, and a review against the rules you wrote in plain language.",
  },
  {
    n: "03",
    icon: I.strike,
    title: "It strikes the hallmark",
    body: "Sound work is marked Assayed. Anything that breaks a test or a rule is Held — with the file, the line, and a plain explanation.",
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
      // view — the flow line fills, nodes pop, steps rise. No pin, no scrub, so
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
              [".hiw-node-0", ".hiw-node-1", ".hiw-node-2"],
              { scale: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.18 },
              0.1,
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
    <section id="how-it-works" ref={root} className="scroll-mt-16 border-b border-line">
      <div className="hiw-inner mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="How it works" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            Three steps, then it stays out of your way.
          </h2>
        </Reveal>

        {/* flow track that fills as you scroll (desktop) */}
        <div className="relative mt-16 hidden h-px w-full bg-line md:block">
          <div className="hiw-fill absolute inset-y-0 left-0 w-full origin-left bg-iris" />
          {[16.667, 50, 83.333].map((left, i) => (
            <span
              key={left}
              className={`hiw-node-${i} absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-iris bg-onyx`}
              style={{ left: `${left}%` }}
            />
          ))}
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.n} className={`hiw-step-${i}`}>
              <SpotlightCard className="panel lift h-full p-8 hover:border-iris/40">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface text-iris-soft">
                    {step.icon}
                  </span>
                  <span className="font-mono text-sm tracking-[0.2em] text-ash">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-ivory">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                  {step.body}
                </p>
              </SpotlightCard>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
