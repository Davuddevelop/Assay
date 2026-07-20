import { describe, it, expect, vi } from "vitest";

// server-only throws outside Next's bundling; no-op it. No Supabase env is set
// in tests, so createAdminClient throws and consumeRateLimit degrades to the
// in-memory gate — exactly the fallback path we want to prove.
vi.mock("server-only", () => ({}));

import { consumeRateLimit } from "@/lib/rate-limit-global";

describe("consumeRateLimit (fallback to in-memory when no DB)", () => {
  it("allows up to the limit, then blocks within the window", async () => {
    const key = `test:${Math.random()}`;
    expect(await consumeRateLimit(key, 2, 60)).toBe(true);
    expect(await consumeRateLimit(key, 2, 60)).toBe(true);
    expect(await consumeRateLimit(key, 2, 60)).toBe(false);
  });

  it("keeps separate budgets per key", async () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(await consumeRateLimit(a, 1, 60)).toBe(true);
    expect(await consumeRateLimit(a, 1, 60)).toBe(false);
    // b is untouched.
    expect(await consumeRateLimit(b, 1, 60)).toBe(true);
  });
});
