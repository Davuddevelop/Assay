import Link from "next/link";

import { PLANS, PLAN_ORDER, formatPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Every section is introduced by a number in the left gutter against a full-
 * width rule. It's the cheapest way to make a long page feel surveyed rather
 * than stacked, and it costs no decoration.
 */
export function SectionHead({
  n,
  label,
  title,
  children,
}: {
  n: string;
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-4">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#4a4a52]">{n}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8f8f97]">
            {label}
          </span>
        </div>
        <h2 className="mt-6 max-w-[14ch] font-display text-[1.9rem] font-bold leading-[1.12] tracking-[-0.03em] text-[#f4f1ea] sm:text-[2.3rem]">
          {title}
        </h2>
      </div>
      <div className="lg:col-span-7 lg:col-start-6">{children}</div>
    </div>
  );
}

const PLATFORMS = ["Lovable", "Bolt", "Replit", "v0", "Supabase", "Next.js", "Firebase"];

export function PlatformStrip() {
  return (
    <section className="border-b border-white/[0.07]">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-x-0 gap-y-4 px-6 py-7 sm:px-10">
        <span className="mr-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[#4a4a52]">
          Scans apps built with
        </span>
        {PLATFORMS.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && <span aria-hidden className="mx-6 h-3 w-px bg-white/[0.12]" />}
            <span className="font-mono text-[11px] tracking-[0.1em] text-[#8f8f97]">{p}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Paste a URL",
    body: "No install, no repo access, no config. Assay works against the running app, the way a stranger meets it.",
  },
  {
    n: "02",
    title: "It probes, it doesn't guess",
    body: "Keys in the bundle, database rules, auth gaps, headers, unsafe defaults. Every claim is something it actually reached.",
  },
  {
    n: "03",
    title: "You get the fix",
    body: "Each finding comes with the change to make, written to paste straight back into the tool that built the app.",
  },
];

export function Process() {
  return (
    <section id="how" className="border-b border-white/[0.07]">
      <div className="mx-auto max-w-[76rem] px-6 py-24 sm:px-10 lg:py-28">
        <SectionHead n="03" label="Process" title="One minute, start to fix." />
        <div className="mt-16 grid grid-cols-1 border-t border-white/[0.07] sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "border-white/[0.07] px-0 py-9 sm:px-8",
                i === 0 && "sm:pl-0",
                i > 0 && "border-t sm:border-l sm:border-t-0",
                i === STEPS.length - 1 && "sm:pr-0",
              )}
            >
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#4a4a52]">{s.n}</span>
              <h3 className="mt-5 font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-[#f4f1ea]">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[34ch] text-[14px] leading-[1.7] text-[#8f8f97]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingV2() {
  return (
    <section id="pricing" className="border-b border-white/[0.07]">
      <div className="mx-auto max-w-[76rem] px-6 py-24 sm:px-10 lg:py-28">
        <SectionHead
          n="04"
          label="Pricing"
          title="Checking is free. Watching isn’t."
        >
          <p className="max-w-[52ch] text-[15px] leading-[1.7] text-[#9a9aa2]">
            A one-off check costs nothing and always will — an outside opinion
            you have to pay for isn&rsquo;t much of an outside opinion. What you
            pay for is Assay re-checking your app after every change you ship,
            and telling you the moment something breaks.
          </p>
        </SectionHead>

        <div className="mt-16 grid grid-cols-1 border-t border-white/[0.07] sm:grid-cols-3">
          {PLAN_ORDER.map((id, i) => {
            const p = PLANS[id];
            return (
              <div
                key={id}
                className={cn(
                  "relative border-white/[0.07] py-10 sm:px-8",
                  i > 0 && "border-t sm:border-l sm:border-t-0",
                  i === 0 && "sm:pl-0",
                  i === PLAN_ORDER.length - 1 && "sm:pr-0",
                )}
              >
                {/* A rule, not a filled card — emphasis without a container. */}
                {p.highlighted && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -top-px h-px bg-[#8b8bf0] sm:left-8 sm:right-8"
                  />
                )}
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8f97]">
                    {p.name}
                  </span>
                  {p.highlighted && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#b9b6f7]">
                      Most picked
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-[2.4rem] font-bold leading-none tracking-[-0.03em] text-[#f4f1ea]">
                    {formatPrice(p)}
                  </span>
                  <span className="font-mono text-[11px] text-[#5a5a62]">/mo</span>
                </div>
                <p className="mt-3 text-[13px] text-[#6f6f78]">{p.tagline}</p>

                <ul className="mt-8 space-y-2.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-3 text-[13.5px] leading-[1.6] text-[#9a9aa2]"
                    >
                      <span aria-hidden className="mt-[9px] h-px w-2.5 shrink-0 bg-white/25" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={id === "free" ? "/try" : "/login"}
                  className={cn(
                    "mt-9 inline-block rounded-[2px] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                    p.highlighted
                      ? "bg-[#f4f1ea] text-[#08080a] hover:bg-white"
                      : "border border-white/[0.16] text-[#f4f1ea] hover:border-white/40",
                  )}
                >
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
