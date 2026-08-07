import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { HeroV2 } from "@/components/landing/hero-v2";
import { HERO_IMAGE_PORTRAIT } from "@/lib/hero-image";
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
 * The landing page — the photographic hero, then five sections: the argument,
 * the symptom, the evidence, the steps, the price. The previous design is
 * preserved at /classic.
 */
/**
 * Does the phone-shaped hero photograph actually exist?
 *
 * Evaluated once at build time, on a statically prerendered page, so it costs
 * nothing per request. It is here rather than in the component because the
 * component is a client component and cannot read the filesystem.
 *
 * The reason it exists at all: a <picture><source> whose srcset 404s renders a
 * broken image — it does not fall back to the <img>. This repo has already
 * shipped a hero whose image had not landed yet, so the asset and the markup
 * that needs it are decoupled on purpose. If the file is missing, phones get
 * the landscape crop they have today and nothing is broken.
 */
const hasPortraitHero = existsSync(
  join(process.cwd(), "public", HERO_IMAGE_PORTRAIT),
);

export default function LandingPage() {
  return (
    <>
      <HeroV2 portrait={hasPortraitHero} />
      {/* The scrolling logo marquee that sat here is gone.
          Three reasons, in order of weight. It is the single most generic
          block in SaaS — every template ships one, which is exactly the "looks
          AI-generated" charge this page is trying to answer. It said nothing
          new: the hero eyebrow one screen above already reads "Lovable · Bolt ·
          Replit · v0". And half its logos were Next.js, React, Stripe and
          Firebase, which are things we *detect*, not platforms we scan — so it
          quietly overstated the product to anyone reading carefully.
          The component still exists and /gdg still uses it. */}
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
