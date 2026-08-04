import { PricingTable } from "@/components/pricing-table";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

/** Pricing on the landing page itself — the ladder, in context. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 edge-b">
      {/* A utility section, sized like one. Every section on this page used to
          share the same headline size and the same py-28, so the page read as
          six equal chapters — the argument sections (the problem, the closing
          CTA) keep the large display size; the ones that just present a table
          or a sequence step down. Hierarchy between sections, not only within
          them. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 xl:max-w-7xl xl:py-24">
        <Reveal>
          <Eyebrow label="Pricing" />
          <h2 className="mt-5 max-w-2xl font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ivory sm:text-[2rem] xl:text-[2.4rem]">
            Free to start. Fair as you grow.
          </h2>
        </Reveal>

        <div className="mt-12">
          <PricingTable />
        </div>
      </div>
    </section>
  );
}
