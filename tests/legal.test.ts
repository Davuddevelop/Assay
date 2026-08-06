import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  LEGAL_VERSION,
  LEGAL_DOCUMENTS,
  BINDING_DOCUMENTS,
  needsAcceptance,
} from "@/lib/legal";

describe("the legal document registry", () => {
  // The registry drives the footer, the sitemap and the acceptance notice. A
  // typo in a slug means a policy that is linked from every page of the site
  // and 404s — which is worse than not publishing it.
  it("points every document at a route that exists", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      const page = resolve(
        process.cwd(),
        `app/(marketing)${doc.slug}/page.tsx`,
      );
      expect(existsSync(page), `${doc.slug} has no page.tsx`).toBe(true);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = LEGAL_DOCUMENTS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses root-relative slugs, never absolute URLs", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.slug.startsWith("/"), doc.slug).toBe(true);
      expect(doc.slug).not.toContain("://");
    }
  });

  // The notice reads "you agree to X, Y and Z". One binding document makes it
  // ungrammatical; none makes it meaningless.
  it("marks at least two documents binding", () => {
    expect(BINDING_DOCUMENTS.length).toBeGreaterThanOrEqual(2);
  });

  // A privacy policy is a disclosure, not a term someone agrees to. Presenting
  // it as something "accepted" is the thing regulators object to, so this is
  // pinned rather than left to whoever edits the array next.
  it("never treats the privacy policy as something to accept", () => {
    const privacy = LEGAL_DOCUMENTS.find((d) => d.slug === "/privacy");
    expect(privacy).toBeDefined();
    expect(privacy!.binding).toBe(false);
  });

  it("uses a version string a human can compare to a document's date", () => {
    expect(LEGAL_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("needsAcceptance", () => {
  it("is satisfied only by the current version", () => {
    expect(needsAcceptance(LEGAL_VERSION)).toBe(false);
  });

  // Failing towards "ask again" is the safe direction: showing the notice to
  // someone who already accepted is an annoyance, hiding it from someone who
  // didn't is the failure that matters. So anything unrecognised re-asks —
  // including a value from the future, which means a rolled-back deploy.
  it("re-asks for no record, an older version, or anything unrecognised", () => {
    for (const stored of [null, undefined, "", "2025-01-01", "2099-01-01", "v1"]) {
      expect(needsAcceptance(stored), JSON.stringify(stored)).toBe(true);
    }
  });
});
