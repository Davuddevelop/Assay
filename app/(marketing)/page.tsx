import { HeroV2 } from "@/components/landing/hero-v2";
import { LogoLoop } from "@/components/landing/logo-loop";
import { Problem } from "@/components/landing/problem";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HallmarkApplied } from "@/components/landing/hallmark-applied";
import { Pricing } from "@/components/landing/pricing";
import { PricingCta } from "@/components/landing/pricing-cta";
import { SiteFooter } from "@/components/landing/site-footer";

/**
 * The landing page (v2) — silk-backed hero with the Blur Text reveal, the
 * LogoLoop compatibility marquee, and the editorial sections. The previous
 * design is preserved at /classic.
 */
export default function LandingPage() {
  return (
    <>
      <HeroV2 />
      <section className="edge-b py-12">
        <p className="mb-7 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
          Scans apps built with
        </p>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <LogoLoop />
        </div>
      </section>
      <Problem />
      <FeatureBento />
      <HowItWorks />
      <HallmarkApplied />
      <Pricing />
      <PricingCta />
      <SiteFooter />
    </>
  );
}
