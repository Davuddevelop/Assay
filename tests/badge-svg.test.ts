import { describe, it, expect } from "vitest";

import { badgeStateFor, renderBadgeSvg } from "@/lib/scan/badge-svg";

describe("badgeStateFor", () => {
  it("is a certified pass when current and conclusive", () => {
    expect(badgeStateFor(true, false, true)).toEqual({ status: "Certified", tone: "ok" });
  });
  it("greys to Expired once the pass ages out", () => {
    expect(badgeStateFor(true, true, true)).toEqual({ status: "Expired", tone: "stale" });
  });
  it("is At risk when not certified (regardless of age)", () => {
    expect(badgeStateFor(false, false, true)).toEqual({ status: "At risk", tone: "bad" });
    expect(badgeStateFor(false, true, true)).toEqual({ status: "At risk", tone: "bad" });
  });

  // The gap this closes: passing every check that ran, having never run the
  // check that matters, used to be indistinguishable from a clean bill.
  it("never says Certified when the scan could not examine everything", () => {
    expect(badgeStateFor(true, false, false)).toEqual({
      status: "Incomplete",
      tone: "stale",
    });
  });

  // Real findings outrank an incomplete scan: an app with an open database is
  // At risk whether or not the rest of the checks finished.
  it("keeps At risk ahead of Incomplete", () => {
    expect(badgeStateFor(false, false, false)).toEqual({ status: "At risk", tone: "bad" });
  });

  // Expiry says a true result got old. Incomplete says there was never a full
  // result to age, which is the more honest thing to show.
  it("keeps Incomplete ahead of Expired", () => {
    expect(badgeStateFor(true, true, false)).toEqual({ status: "Incomplete", tone: "stale" });
  });
});

describe("renderBadgeSvg", () => {
  it("emits a valid self-contained SVG with the status text", () => {
    const svg = renderBadgeSvg(badgeStateFor(true, false, true));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("xmlns=\"http://www.w3.org/2000/svg\"");
    expect(svg).toContain("Assay");
    expect(svg).toContain("Certified");
    expect(svg).toContain("#8b7cf6"); // iris fill for a current pass
    expect(svg).not.toContain("<script");
  });

  it("uses the grey fill when expired and oxblood when at risk", () => {
    expect(renderBadgeSvg(badgeStateFor(true, true, true))).toContain("#6E695C");
    expect(renderBadgeSvg(badgeStateFor(false, false, true))).toContain("#8E3A2F");
  });

  // The embeddable image is the version that ends up on someone else's site,
  // so it must not carry the pass tone for a scan that established nothing.
  it("does not use the pass tone for an incomplete scan", () => {
    const svg = renderBadgeSvg(badgeStateFor(true, false, false));
    expect(svg).toContain("#6E695C");
    expect(svg).not.toContain("#8b7cf6");
    expect(svg).not.toContain("Certified");
  });

  it("sets an accessible label", () => {
    expect(renderBadgeSvg(badgeStateFor(true, false, true))).toContain(
      'aria-label="Assay: Certified"',
    );
  });
});
