import type { Metadata } from "next";
import Link from "next/link";

import { Silk } from "@/components/landing/silk";
import { HeroV2Sharp } from "@/components/landing-v2/hero";
import { Specimen } from "@/components/landing-v2/specimen";
import { PlatformStrip, Process, PricingV2, SectionHead } from "@/components/landing-v2/sections";

export const metadata: Metadata = {
  title: "Assay — v2",
  description: "A sharper cut of the Assay landing page.",
  // An alternate treatment of the same content. Indexing it would split
  // ranking signals with the real landing page for no gain.
  robots: { index: false, follow: false },
};

export default function LandingV2() {
  return (
    <>
      <HeroV2Sharp />
      <PlatformStrip />

      <section id="problem" className="border-b border-white/[0.07]">
        <div className="mx-auto max-w-[76rem] px-6 py-24 sm:px-10 lg:py-28">
          <SectionHead n="01" label="The gap" title="Looking finished isn’t being safe.">
            <div className="space-y-6 text-[15px] leading-[1.75] text-[#9a9aa2]">
              <p>
                The tools are extraordinary at producing something that works.
                They are not accountable for what happens after real people,
                real payments and real data arrive — and they were never asked
                to be.
              </p>
              <p>
                So the defaults ship. The admin key sits in the bundle. The
                database answers anyone who asks. Nothing looks wrong, because
                nothing looks like anything at all until someone finds it.
              </p>
              <p className="text-[#f4f1ea]">
                Assay has no stake in your app passing. That is the entire
                product.
              </p>
            </div>
          </SectionHead>
        </div>
      </section>

      <section id="specimen" className="border-b border-white/[0.07]">
        <div className="mx-auto max-w-[76rem] px-6 py-24 sm:px-10 lg:py-28">
          <SectionHead n="02" label="The report" title="Findings, not a score to interpret.">
            <p className="max-w-[52ch] text-[15px] leading-[1.75] text-[#9a9aa2]">
              Every line below is something Assay actually reached from outside
              the app — no inference, no severity theatre. Written for someone
              who has never read a security report, with the change to make
              attached to each one.
            </p>
          </SectionHead>
          <div className="mt-16">
            <Specimen />
          </div>
        </div>
      </section>

      <Process />
      <PricingV2 />

      {/* The page opens and closes on the same material. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <Silk className="absolute inset-0 h-full w-full opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#08080a_0%,rgba(8,8,10,0.78)_40%,rgba(8,8,10,0.62)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#08080a] to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-[76rem] px-6 py-28 text-center sm:px-10 lg:py-36">
          <h2 className="mx-auto max-w-[18ch] font-display text-[2.1rem] font-bold leading-[1.1] tracking-[-0.035em] text-[#f4f1ea] sm:text-[3rem]">
            Find out before someone else does.
          </h2>
          <p className="mx-auto mt-6 max-w-[44ch] text-[15px] leading-[1.7] text-[#9a9aa2]">
            One check, free, about a minute. You&rsquo;ll know exactly where you
            stand and exactly what to change.
          </p>
          <Link
            href="/try"
            className="mt-11 inline-block rounded-[2px] bg-[#f4f1ea] px-8 py-3.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#08080a] transition-colors hover:bg-white"
          >
            Scan my app
          </Link>
        </div>
      </section>
    </>
  );
}
