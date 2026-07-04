import { describe, expect, it } from "vitest";

import { compareScans } from "@/lib/scan/diff";

const certified = (score: number) => ({ score, verdict: "certified" as const });
const atRisk = (score: number) => ({ score, verdict: "at_risk" as const });

describe("compareScans", () => {
  it("is neutral when either side is missing", () => {
    expect(compareScans(null, certified(90))).toEqual({
      scoreDelta: null,
      regression: false,
      improved: false,
    });
    expect(compareScans(certified(90), null)).toEqual({
      scoreDelta: null,
      regression: false,
      improved: false,
    });
  });

  it("flags a regression when the verdict flips to at-risk", () => {
    const d = compareScans(certified(92), atRisk(60));
    expect(d.regression).toBe(true);
    expect(d.improved).toBe(false);
    expect(d.scoreDelta).toBe(-32);
  });

  it("flags a regression on a score drop even without a verdict flip", () => {
    const d = compareScans(certified(95), certified(88));
    expect(d.regression).toBe(true);
    expect(d.improved).toBe(false);
  });

  it("flags an improvement when the verdict flips to certified", () => {
    const d = compareScans(atRisk(55), certified(94));
    expect(d.improved).toBe(true);
    expect(d.regression).toBe(false);
    expect(d.scoreDelta).toBe(39);
  });

  it("is steady when nothing changed", () => {
    const d = compareScans(certified(92), certified(92));
    expect(d).toEqual({ scoreDelta: 0, regression: false, improved: false });
  });

  it("handles missing scores without crashing", () => {
    const d = compareScans(
      { score: null, verdict: "certified" },
      { score: null, verdict: "at_risk" },
    );
    expect(d.scoreDelta).toBeNull();
    expect(d.regression).toBe(true);
  });
});
