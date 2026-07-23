import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

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
    {
      url: `${base}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/acceptable-use`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
