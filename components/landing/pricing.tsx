import { PricingTable } from "@/components/pricing-table";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

/** Pricing on the landing page itself — the ladder, in context. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 edge-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="Pricing" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            Free to start. Fair as you{" "}
            <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
              grow
            </span>
            .
          </h2>
        </Reveal>

        <div className="mt-14">
          <PricingTable />
        </div>
      </div>
    </section>
  );
}
