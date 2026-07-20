import { describe, it, expect } from "vitest";

import { verificationFreshness, VALID_DAYS } from "@/lib/scan/freshness";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 0, 31); // fixed reference

function daysAgo(n: number): string {
  return new Date(now - n * DAY).toISOString();
}

describe("verificationFreshness", () => {
  it("is unknown without a completion time", () => {
    const f = verificationFreshness(null, now);
    expect(f.state).toBe("unknown");
    expect(f.ageDays).toBeNull();
    expect(f.daysLeft).toBeNull();
  });

  it("is unknown for an unparseable date", () => {
    expect(verificationFreshness("not-a-date", now).state).toBe("unknown");
  });

  it("reads fresh right after the scan", () => {
    const f = verificationFreshness(daysAgo(0), now);
    expect(f.state).toBe("fresh");
    expect(f.ageDays).toBe(0);
    expect(f.label).toBe("Verified today");
  });

  it("stays fresh well within the window", () => {
    const f = verificationFreshness(daysAgo(10), now);
    expect(f.state).toBe("fresh");
    expect(f.daysLeft).toBe(VALID_DAYS - 10);
    expect(f.label).toContain("10 days ago");
  });

  it("turns aging as expiry approaches", () => {
    const f = verificationFreshness(daysAgo(25), now);
    expect(f.state).toBe("aging");
    expect(f.daysLeft).toBe(5);
    expect(f.label).toBe("Expires in 5 days");
  });

  it("expires past the validity window", () => {
    const f = verificationFreshness(daysAgo(VALID_DAYS + 1), now);
    expect(f.state).toBe("expired");
    expect(f.daysLeft).toBeLessThanOrEqual(0);
    expect(f.label).toBe("Verification expired");
  });

  it("expires exactly at the window boundary", () => {
    const f = verificationFreshness(daysAgo(VALID_DAYS), now);
    expect(f.state).toBe("expired");
  });
});
