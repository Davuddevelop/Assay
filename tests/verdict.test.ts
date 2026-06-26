import { describe, it, expect } from "vitest";

import { decideVerdict, isBlocking } from "@/lib/verdict";

describe("verdict engine", () => {
  it("assays a clean change (no findings)", () => {
    const { verdict } = decideVerdict([]);
    expect(verdict).toBe("assayed");
  });

  it("assays when only low/medium quality notes exist", () => {
    const r = decideVerdict([
      { type: "quality", severity: "low" },
      { type: "quality", severity: "medium" },
    ]);
    expect(r.verdict).toBe("assayed");
    expect(r.summary).toContain("advisory");
  });

  it("holds on a high-severity quality finding", () => {
    expect(decideVerdict([{ type: "quality", severity: "high" }]).verdict).toBe(
      "held",
    );
  });

  it("holds on a critical-severity finding", () => {
    expect(
      decideVerdict([{ type: "quality", severity: "critical" }]).verdict,
    ).toBe("held");
  });

  it("holds on any rule violation, even low severity", () => {
    expect(decideVerdict([{ type: "rule", severity: "low" }]).verdict).toBe(
      "held",
    );
  });

  it("holds on any security finding", () => {
    expect(decideVerdict([{ type: "security", severity: "low" }]).verdict).toBe(
      "held",
    );
  });

  it("holds on any test failure", () => {
    expect(decideVerdict([{ type: "test", severity: "medium" }]).verdict).toBe(
      "held",
    );
  });

  it("counts blocking findings in the held summary", () => {
    const r = decideVerdict([
      { type: "rule", severity: "low" },
      { type: "security", severity: "high" },
      { type: "quality", severity: "low" }, // not blocking
    ]);
    expect(r.verdict).toBe("held");
    expect(r.summary).toContain("2 issues");
  });

  it("isBlocking is precise per finding", () => {
    expect(isBlocking({ type: "quality", severity: "low" })).toBe(false);
    expect(isBlocking({ type: "quality", severity: "high" })).toBe(true);
    expect(isBlocking({ type: "rule", severity: "low" })).toBe(true);
  });
});
