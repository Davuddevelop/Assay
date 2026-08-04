import type { Metadata } from "next";

import { HeroV2 } from "@/components/landing/hero-v2";
import { LogoLoop } from "@/components/landing/logo-loop";
import { Independence } from "@/components/landing/independence";
import { Problem } from "@/components/landing/problem";
import { FeatureBento } from "@/components/landing/feature-bento";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HallmarkApplied } from "@/components/landing/hallmark-applied";
import { SocialProof } from "@/components/landing/social-proof";
import { Pricing } from "@/components/landing/pricing";
import { PricingCta } from "@/components/landing/pricing-cta";

// The scan counter reads the database, which would otherwise turn the most
// visited page on the site into a per-request query. Hourly ISR keeps it
// cached; the number does not need to be fresher than that.
export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Argument-led, like the page itself — but the description keeps the
  // concrete terms someone actually searches for. The positioning shift is
  // about what a human reads first, not about hiding what the product does
  // from anyone looking for it.
  title: "The Independent Security Check for AI-Built Apps — Assay",
  description:
    "The tool that built your app can't be the one that clears it. Assay is a free outside security check for apps built with Lovable, Bolt, Replit or v0 — exposed keys, open Supabase RLS, missing protections, each with the exact fix.",
};

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
      {/* Argument, then symptom, then proof. The independence claim comes
          before anything about what we detect — a feature list is a fight we
          lose, and the position is the one thing a platform's own built-in
          scanner structurally cannot copy. */}
      <Independence />
      <Problem />
      <FeatureBento />
      <HowItWorks />
      <HallmarkApplied />
      {/* Renders nothing at all until there is something true to put in it. */}
      <SocialProof />
      <Pricing />
      <PricingCta />
    </>
  );
}
