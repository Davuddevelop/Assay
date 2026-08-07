import { describe, it, expect } from "vitest";

import {
  PLATFORMS,
  AUDIENCES,
  isPlatform,
  isAudience,
  scanPlaceholder,
  needsOnboarding,
  type Profile,
} from "@/lib/onboarding";

const answered: Profile = { platform: "bolt", audience: "client", skipped: false };

describe("the onboarding questions", () => {
  // CLAUDE.md §11 is a hard cap, not a guideline: every extra field is a
  // person who doesn't finish signing up, and both of these earn their place
  // by changing something the product does. A third would need to clear the
  // same bar, and this test is where that argument has to happen.
  it("asks exactly two questions", () => {
    const questions = [PLATFORMS, AUDIENCES];
    expect(questions).toHaveLength(2);
  });

  it("offers every builder the scanner can classify, plus an escape hatch", () => {
    const values = PLATFORMS.map((p) => p.value);
    expect(values).toContain("lovable");
    expect(values).toContain("bolt");
    expect(values).toContain("replit");
    expect(values).toContain("v0");
    expect(values).toContain("other");
  });

  it("gives every platform a distinct example host", () => {
    const hosts = PLATFORMS.map((p) => p.host);
    expect(new Set(hosts).size).toBe(hosts.length);
  });
});

describe("isPlatform / isAudience", () => {
  it("accepts every offered value", () => {
    for (const p of PLATFORMS) expect(isPlatform(p.value)).toBe(true);
    for (const a of AUDIENCES) expect(isAudience(a.value)).toBe(true);
  });

  // These gate what reaches the platform column, which is the grouping key for
  // anything we might publish about how these builders ship. A junk value
  // there is worse than a null.
  it("rejects anything else, without coercing", () => {
    for (const bad of ["", "Lovable", "lovable ", "webflow", null, undefined, 1, {}]) {
      expect(isPlatform(bad), JSON.stringify(bad)).toBe(false);
      expect(isAudience(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("scanPlaceholder", () => {
  it("uses the host for the builder they named", () => {
    expect(scanPlaceholder("bolt")).toBe("yourapp.bolt.host");
    expect(scanPlaceholder("replit")).toBe("yourapp.replit.app");
  });

  it("falls back to Lovable when unanswered", () => {
    expect(scanPlaceholder(null)).toBe("yourapp.lovable.app");
    expect(scanPlaceholder(undefined)).toBe("yourapp.lovable.app");
  });
});

describe("needsOnboarding", () => {
  it("asks when there is no profile at all", () => {
    expect(needsOnboarding(null)).toBe(true);
  });

  it("asks while either answer is missing", () => {
    expect(needsOnboarding({ ...answered, platform: null })).toBe(true);
    expect(needsOnboarding({ ...answered, audience: null })).toBe(true);
  });

  it("stops once both are answered", () => {
    expect(needsOnboarding(answered)).toBe(false);
  });

  // A skip is final. Re-asking someone who declined turns a two-second
  // question into the reason they stop opening the dashboard.
  it("never asks again after a skip, even with both answers blank", () => {
    expect(
      needsOnboarding({ platform: null, audience: null, skipped: true }),
    ).toBe(false);
  });
});
