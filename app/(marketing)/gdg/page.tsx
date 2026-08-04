import type { Metadata } from "next";

import { HeroV2 } from "@/components/landing/hero-v2";
import { LogoLoop } from "@/components/landing/logo-loop";
import { Independence } from "@/components/landing/independence";
import { Problem } from "@/components/landing/problem";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HallmarkApplied } from "@/components/landing/hallmark-applied";
import { Pricing } from "@/components/landing/pricing";
import { PricingCta } from "@/components/landing/pricing-cta";

export const metadata: Metadata = {
  title: "Assay — for the builders I actually know",
  description:
    "The independent security check for apps built with Lovable, Bolt, Replit and v0.",
  // Deliberately not indexed. This is the landing page with a different first
  // paragraph, and a near-duplicate of / in the search index is a thin-content
  // penalty in exchange for nothing. Its only job is to be clicked from a
  // message I sent someone personally.
  robots: { index: false, follow: true },
};

/**
 * A linkable variant of the landing page for the founder's own network — GDG,
 * hackathon and builder-community outreach.
 *
 * Cheap on purpose: it is the real landing page with one short note bolted to
 * the top, not a second site. Every section below is the same component the
 * main page renders, so the two cannot drift and there is nothing extra to
 * maintain. If this angle turns out not to work, deleting the route removes
 * all of it.
 *
 * A route rather than a query parameter because a plain link is what actually
 * gets pasted into a Discord message, and ?from=gdg gets stripped, mangled, or
 * quietly dropped by half the clients that touch it.
 */
export default function GdgLandingPage() {
  return (
    <>
      <div className="border-b border-line bg-surface/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
            A note first
          </p>
          <p className="mt-4 text-base leading-relaxed text-ivory-dim">
            <span className="text-ivory">
              If you&rsquo;re reading this, I probably sent you the link myself.
            </span>{" "}
            Assay is the thing I&rsquo;ve been building — an independent
            security check for apps built with Lovable, Bolt, Replit and v0. It
            is early and I am one person, which means the most useful thing you
            can do is run it on something you&rsquo;ve actually shipped and then
            tell me where it was wrong, boring, or confusing. That feedback is
            worth more to me right now than a signup.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ivory-dim">
            No account needed for a first result. Everything below is the same
            as the public site.
          </p>
        </div>
      </div>

      <HeroV2 />
      <section className="edge-b py-12">
        <p className="mb-7 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
          Scans apps built with
        </p>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <LogoLoop />
        </div>
      </section>
      <Independence />
      <Problem />
      <FeatureBento />
      <HowItWorks />
      <HallmarkApplied />
      <Pricing />
      <PricingCta />
    </>
  );
}
