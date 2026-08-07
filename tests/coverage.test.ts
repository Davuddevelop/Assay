import { describe, it, expect } from "vitest";

import {
  computeCoverage,
  isConclusive,
  gaps,
  type ScanObservations,
} from "@/lib/scan/coverage";

/** A scan that saw everything: real app, bundles read, backend found. */
const full: ScanObservations = {
  bundleCount: 6,
  backendDetected: true,
  backendName: "Supabase",
  bundleCrawlTruncated: false,
  unscannable: false,
};

const get = (o: ScanObservations, id: string) =>
  computeCoverage(o).find((c) => c.id === id)!;

describe("computeCoverage", () => {
  it("reports every check, not only the gaps", () => {
    const ids = computeCoverage(full).map((c) => c.id);
    expect(ids).toEqual(["secrets", "database", "storage", "files", "headers"]);
  });

  it("marks everything examined when the scan saw the whole app", () => {
    expect(computeCoverage(full).every((c) => c.status === "examined")).toBe(true);
  });
});

// The bug this module exists for. A real app that renders fine and ships
// bundles, but whose backend never appears in the public code — custom
// domain, minifier-split URL, or a server-side proxy — had its database
// check silently skipped and was then certified.
describe("the quiet false pass", () => {
  const noBackend: ScanObservations = {
    ...full,
    backendDetected: false,
    backendName: null,
  };

  it("does not claim the database was examined when none was found", () => {
    expect(get(noBackend, "database").status).toBe("nothing-to-check");
  });

  it("says plainly that not finding a database is not the same as it being safe", () => {
    expect(get(noBackend, "database").detail).toMatch(/not the same as it being safe/i);
  });

  it("names both reasons, because from outside they are indistinguishable", () => {
    const detail = get(noBackend, "database").detail;
    expect(detail).toMatch(/doesn't use one/i);
    expect(detail).toMatch(/your own server/i);
  });

  it("refuses to call the scan conclusive", () => {
    expect(isConclusive(computeCoverage(noBackend))).toBe(false);
  });

  // The whole point: a scan with zero findings must still be distinguishable
  // from a scan that checked nothing. Coverage is what carries that.
  it("still reports the checks that did run as examined", () => {
    expect(get(noBackend, "secrets").status).toBe("examined");
    expect(get(noBackend, "headers").status).toBe("examined");
  });
});

describe("an app we never actually saw", () => {
  const hidden: ScanObservations = { ...full, unscannable: true };

  it("marks every content-dependent check incomplete", () => {
    for (const id of ["secrets", "database", "files", "headers"]) {
      expect(get(hidden, id).status, id).toBe("incomplete");
    }
  });

  it("is never conclusive", () => {
    expect(isConclusive(computeCoverage(hidden))).toBe(false);
  });
});

describe("a partial read of the code", () => {
  it("flags a truncated bundle crawl rather than implying a full search", () => {
    const truncated = { ...full, bundleCrawlTruncated: true };
    expect(get(truncated, "secrets").status).toBe("incomplete");
    expect(get(truncated, "secrets").detail).toMatch(/didn't reach/i);
    expect(isConclusive(computeCoverage(truncated))).toBe(false);
  });

  it("flags a page that shipped no readable JavaScript at all", () => {
    const noJs = { ...full, bundleCount: 0 };
    expect(get(noJs, "secrets").status).toBe("incomplete");
    expect(isConclusive(computeCoverage(noJs))).toBe(false);
  });
});

describe("isConclusive", () => {
  it("requires every check to have actually run", () => {
    expect(isConclusive(computeCoverage(full))).toBe(true);
  });

  // Conclusive and clean are different questions. A scan can be conclusive and
  // full of problems, or clean and inconclusive — the report answers both, and
  // conflating them is what produced the misleading pass in the first place.
  it("says nothing about whether issues were found", () => {
    expect(isConclusive(computeCoverage(full))).toBe(true);
    expect(computeCoverage(full).some((c) => "severity" in c)).toBe(false);
  });
});

describe("gaps", () => {
  it("is empty for a scan that examined everything", () => {
    expect(gaps(computeCoverage(full))).toHaveLength(0);
  });

  it("returns only the checks that did not run", () => {
    const noBackend = { ...full, backendDetected: false, backendName: null };
    const g = gaps(computeCoverage(noBackend)).map((c) => c.id);
    expect(g).toContain("database");
    expect(g).toContain("storage");
    expect(g).not.toContain("headers");
  });
});
