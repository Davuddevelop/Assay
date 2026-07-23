import type { Metadata } from "next";

import { Hero } from "@/components/landing/hero";
import { StackStrip } from "@/components/landing/stack-strip";
import { Problem } from "@/components/landing/problem";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HallmarkApplied } from "@/components/landing/hallmark-applied";
import { Pricing } from "@/components/landing/pricing";
import { PricingCta } from "@/components/landing/pricing-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export const metadata: Metadata = {
  title: "Classic layout — Assay",
  description:
    "The previous landing design, kept for reference. The current design lives at the home page.",
  robots: { index: false, follow: true },
};

/** The classic landing — preserved at /classic. The v2 design is the home page. */
export default function ClassicLandingPage() {
  return (
    <>
      <Hero />
      <StackStrip />
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
