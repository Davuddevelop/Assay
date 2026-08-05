import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { GUIDES, guideBySlug, otherGuides } from "@/lib/guides";

/**
 * The guide index drives three things — the /guides page, the sitemap, and the
 * read-next footer. A slug with no page behind it means we link readers and
 * Google to a 404, which is worse than not publishing at all.
 */
describe("guide index", () => {
  it("every listed guide has a real page", () => {
    for (const g of GUIDES) {
      const page = resolve(
        process.cwd(),
        `app/(marketing)/guides/${g.slug}/page.tsx`,
      );
      expect(existsSync(page), `missing page for "${g.slug}"`).toBe(true);
    }
  });

  it("slugs are unique and URL-safe", () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("each guide carries a title, a real summary and a reading time", () => {
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(10);
      // A one-word summary is a placeholder, and placeholders ship.
      expect(g.summary.split(" ").length).toBeGreaterThan(8);
      expect(g.minutes).toBeGreaterThan(0);
    }
  });

  it("otherGuides excludes only itself", () => {
    const slug = GUIDES[0].slug;
    const rest = otherGuides(slug);
    expect(rest).toHaveLength(GUIDES.length - 1);
    expect(rest.some((g) => g.slug === slug)).toBe(false);
  });

  it("guideBySlug finds a real one and misses a fake one", () => {
    expect(guideBySlug(GUIDES[0].slug)?.title).toBe(GUIDES[0].title);
    expect(guideBySlug("not-a-guide")).toBeUndefined();
  });
});
