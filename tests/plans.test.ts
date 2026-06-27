import { describe, it, expect } from "vitest";

import { getPlan, checksLimit, nextPlan, formatPrice, PLAN_ORDER } from "@/lib/plans";

describe("plan catalog", () => {
  it("resolves known plans", () => {
    expect(getPlan("pro").priceMonthly).toBe(19);
    expect(getPlan("team").priceMonthly).toBe(99);
  });

  it("defaults unknown plans to free", () => {
    expect(getPlan("enterprise").id).toBe("free");
    expect(getPlan("").id).toBe("free");
  });

  it("maps plans to monthly check limits", () => {
    expect(checksLimit("free")).toBe(100);
    expect(checksLimit("pro")).toBe(2000);
    expect(checksLimit("team")).toBe(10000);
    expect(checksLimit("bogus")).toBe(100);
  });

  it("upsells to the next tier and stops at the top", () => {
    expect(nextPlan("free")?.id).toBe("pro");
    expect(nextPlan("pro")?.id).toBe("team");
    expect(nextPlan("team")).toBeNull();
  });

  it("formats prices", () => {
    expect(formatPrice(getPlan("free"))).toBe("$0");
    expect(formatPrice(getPlan("pro"))).toBe("$19");
  });

  it("orders tiers free → pro → team", () => {
    expect(PLAN_ORDER).toEqual(["free", "pro", "team"]);
  });
});
