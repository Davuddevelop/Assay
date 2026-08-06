import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";
import { GUIDES } from "@/lib/guides";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

/**
 * Static sitemap for the public marketing surface only. Private/functional
 * app routes (dashboard, scan, billing, apps, login) and the per-user public
 * badge pages are intentionally excluded — see app/robots.ts for the crawl
 * rules that keep the former out of the index, and the badge share flow for
 * how the latter are discovered instead of via sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date("2026-07-01");

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/try`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/sample`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/client-handoff`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/guides`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Generated from the guide index, so a guide can't ship unsubmitted.
    ...GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/watch`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // From the same registry the footer reads, so a new policy is submitted to
    // search engines without anyone remembering to add it in two places.
    ...LEGAL_DOCUMENTS.map((doc) => ({
      url: `${base}${doc.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
