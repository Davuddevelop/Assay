import { describe, it, expect } from "vitest";

import { anonBudget, DEFAULT_ANON_DAILY } from "@/lib/scan/anon-budget";

describe("anonymous scan budget", () => {
  it("uses the configured daily ceiling", () => {
    expect(anonBudget("600").daily).toBe(600);
  });

  // A typo in an env var must never be the thing that opens the tap.
  it("falls back to the default rather than uncapping", () => {
    for (const bad of [undefined, "", "lots", "0", "-1", "NaN", "1e999"]) {
      expect(anonBudget(bad).daily).toBe(DEFAULT_ANON_DAILY);
    }
  });

  it("never yields a non-finite or non-positive ceiling", () => {
    for (const raw of [undefined, "0", "-5", "abc", "Infinity", "1e999", "3.7"]) {
      const b = anonBudget(raw);
      expect(Number.isInteger(b.daily)).toBe(true);
      expect(Number.isInteger(b.hourly)).toBe(true);
      expect(b.daily).toBeGreaterThan(0);
      expect(b.hourly).toBeGreaterThan(0);
    }
  });

  // The point of the hourly tier: a burst must not drain a whole day in minutes.
  it("keeps the hourly ceiling well below the daily one", () => {
    for (const raw of ["250", "1000", "80"]) {
      const b = anonBudget(raw);
      expect(b.hourly).toBeLessThan(b.daily);
    }
  });

  it("keeps a usable floor when the daily ceiling is tiny", () => {
    const b = anonBudget("4");
    expect(b.daily).toBe(4);
    expect(b.hourly).toBeGreaterThanOrEqual(20);
  });
});
