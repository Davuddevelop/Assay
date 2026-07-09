import { describe, expect, it } from "vitest";

import { safeNext } from "@/lib/safe-redirect";

describe("safeNext (open-redirect guard on the OAuth callback)", () => {
  it("allows a plain internal path", () => {
    expect(safeNext("/scan/abc-123")).toBe("/scan/abc-123");
  });

  it("falls back when there's no next param", () => {
    expect(safeNext(null)).toBe("/dashboard");
  });

  it("rejects an absolute URL to another host", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
  });

  it("rejects a protocol-relative path", () => {
    expect(safeNext("//evil.com")).toBe("/dashboard");
  });

  it("rejects the userinfo host-confusion trick", () => {
    // origin + next would become "https://assay.app@evil.com" — evil.com wins.
    expect(safeNext("/@evil.com")).toBe("/dashboard");
  });

  it("rejects a bare scheme without slashes", () => {
    expect(safeNext("javascript:alert(1)")).toBe("/dashboard");
  });
});
