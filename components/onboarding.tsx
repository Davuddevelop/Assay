import Link from "next/link";

import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "1",
    title: "Paste your app's link",
    body: "The live URL of an app you built with Lovable, Bolt, Replit, or v0.",
  },
  {
    n: "2",
    title: "Get your report",
    body: "Every issue in plain English, with the exact prompt to paste back to fix it.",
  },
  {
    n: "3",
    title: "Earn the hallmark",
    body: "Once it's clean, you get the all-clear — the confidence to publish, knowing nothing's exposed.",
  },
];

/** First-run guide for the empty dashboard — points at the first scan. */
export function Onboarding() {
  return (
    <div className="panel relative overflow-hidden p-8 sm:p-10">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-30" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Get started
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Check your first app in under a minute
        </h2>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex gap-4 rounded-[var(--radius-control)] border border-line bg-surface/40 p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-iris/40 bg-iris/10 font-mono text-sm text-iris-soft">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-medium text-ivory">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ivory-dim">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="/scan" variant="primary" size="lg">
            Scan my app
          </Button>
          <Link
            href="/sample"
            className="font-mono text-xs uppercase tracking-[0.14em] text-iris-soft hover:text-ivory"
          >
            See a sample report →
          </Link>
        </div>
      </div>
    </div>
  );
}
