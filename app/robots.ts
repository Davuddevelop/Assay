import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

/**
 * Allow crawl of the public marketing surface; disallow the private/functional
 * app tree. Private pages under this tree also carry their own `noindex` meta
 * (handled per-page) — the disallow rules here are defense in depth so
 * crawlers don't even fetch them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/scan", "/billing", "/apps", "/login", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
