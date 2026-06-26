import type { Metadata } from "next";

import { PricingTable } from "@/components/pricing-table";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Pricing — Assay",
  description:
    "Simple pricing for an independent checkpoint on your AI-written code. Start free.",
};

export default function PricingPage() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-40"
      />

      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
            Pricing
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-ivory sm:text-5xl">
            Pay for what you{" "}
            <span className="font-accent text-[1.06em] font-normal tracking-normal text-iris-soft">
              ship
            </span>
            .
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ivory-dim">
            Start free on a single repo. Upgrade when Assay is part of how you
            work. No seat minimums, cancel anytime.
          </p>
        </div>
      </Reveal>

      <div className="mt-16">
        <PricingTable />
      </div>

      <p className="mx-auto mt-12 max-w-md text-center text-sm text-ash">
        Every plan runs your tests, a security scan, and your own rules — then
        strikes the hallmark. Checks reset on the first of each month.
      </p>
    </div>
  );
}
