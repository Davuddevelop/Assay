import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HallmarkApplied } from "@/components/landing/hallmark-applied";
import { PricingCta } from "@/components/landing/pricing-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <HallmarkApplied />
      <PricingCta />
      <SiteFooter />
    </>
  );
}
