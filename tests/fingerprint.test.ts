import { describe, expect, it } from "vitest";

import { computeFingerprint } from "@/lib/scan/fingerprint";

describe("computeFingerprint (change detection)", () => {
  it("is stable across reloads of the same build", () => {
    const bundles = ["/assets/index-a8f3.js", "/assets/vendor-b21c.js"];
    const a = computeFingerprint("<html>...</html>", bundles);
    const b = computeFingerprint("<html>slightly different inline token</html>", bundles);
    expect(a).toBe(b); // bundle set unchanged → same fingerprint
  });

  it("changes when the app is rebuilt (bundle hashes change)", () => {
    const before = computeFingerprint("<html></html>", ["/assets/index-a8f3.js"]);
    const after = computeFingerprint("<html></html>", ["/assets/index-99ff.js"]);
    expect(after).not.toBe(before);
  });

  it("ignores bundle order", () => {
    const a = computeFingerprint("", ["/a.js", "/b.js"]);
    const b = computeFingerprint("", ["/b.js", "/a.js"]);
    expect(a).toBe(b);
  });

  it("falls back to HTML when there are no bundles", () => {
    const a = computeFingerprint("<html>one</html>", []);
    const b = computeFingerprint("<html>two</html>", []);
    expect(a).not.toBe(b);
  });
});
