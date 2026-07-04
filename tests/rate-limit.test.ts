import { describe, it, expect } from "vitest";

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    const key = `k-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000, 1000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000, 1000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window passes", () => {
    const key = `k-${Math.random()}`;
    rateLimit(key, 1, 60_000, 1000);
    expect(rateLimit(key, 1, 60_000, 1000).ok).toBe(false);
    expect(rateLimit(key, 1, 60_000, 61_001).ok).toBe(true); // new window
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000, 1000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000, 1000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000, 1000).ok).toBe(true); // separate bucket
  });
});
