import { describe, expect, it } from "vitest";

import { buildActivity, type HistoryScan } from "@/lib/monitor/activity";

const s = (id: string, score: number, verdict: "certified" | "at_risk"): HistoryScan => ({
  id,
  at: new Date().toISOString(),
  score,
  verdict,
});

describe("buildActivity (the agent's timeline)", () => {
  it("labels the first check as the baseline", () => {
    const out = buildActivity([s("1", 40, "at_risk")]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("baseline");
  });

  it("catches a regression when a later check drops", () => {
    const out = buildActivity([s("1", 96, "certified"), s("2", 60, "at_risk")]);
    // newest-first
    expect(out[0].kind).toBe("regression");
    expect(out[0].scoreDelta).toBe(-36);
  });

  it("marks a return to safe as fixed", () => {
    const out = buildActivity([s("1", 60, "at_risk"), s("2", 100, "certified")]);
    expect(out[0].kind).toBe("fixed");
    expect(out[0].scoreDelta).toBe(40);
  });

  it("reads unchanged checks as steady", () => {
    const out = buildActivity([s("1", 96, "certified"), s("2", 96, "certified")]);
    expect(out[0].kind).toBe("steady");
  });

  it("returns events newest-first", () => {
    const scans = [s("old", 90, "certified"), s("new", 90, "certified")];
    const out = buildActivity(scans);
    expect(out[0].id).toBe("new");
    expect(out[1].id).toBe("old");
  });
});
