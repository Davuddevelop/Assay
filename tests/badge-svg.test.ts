import { describe, it, expect } from "vitest";

import { badgeStateFor, renderBadgeSvg } from "@/lib/scan/badge-svg";

describe("badgeStateFor", () => {
  it("is a certified pass when current", () => {
    expect(badgeStateFor(true, false)).toEqual({ status: "Certified", tone: "ok" });
  });
  it("greys to Expired once the pass ages out", () => {
    expect(badgeStateFor(true, true)).toEqual({ status: "Expired", tone: "stale" });
  });
  it("is At risk when not certified (regardless of age)", () => {
    expect(badgeStateFor(false, false)).toEqual({ status: "At risk", tone: "bad" });
    expect(badgeStateFor(false, true)).toEqual({ status: "At risk", tone: "bad" });
  });
});

describe("renderBadgeSvg", () => {
  it("emits a valid self-contained SVG with the status text", () => {
    const svg = renderBadgeSvg(badgeStateFor(true, false));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("xmlns=\"http://www.w3.org/2000/svg\"");
    expect(svg).toContain("Assay");
    expect(svg).toContain("Certified");
    expect(svg).toContain("#8b7cf6"); // iris fill for a current pass
    expect(svg).not.toContain("<script");
  });

  it("uses the grey fill when expired and oxblood when at risk", () => {
    expect(renderBadgeSvg(badgeStateFor(true, true))).toContain("#6E695C");
    expect(renderBadgeSvg(badgeStateFor(false, false))).toContain("#8E3A2F");
  });

  it("sets an accessible label", () => {
    expect(renderBadgeSvg(badgeStateFor(true, false))).toContain('aria-label="Assay: Certified"');
  });
});
