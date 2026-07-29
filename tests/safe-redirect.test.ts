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

  // "/" passes the shape test but is never worth returning to: someone who
  // just signed in is the one person who should not land on the marketing
  // page. It also means a crafted ?next=/ can't strand a user there.
  it("rejects a bare slash", () => {
    expect(safeNext("/")).toBe("/dashboard");
    expect(safeNext("/", "/billing")).toBe("/billing");
  });

  // These paths went live when `requireUser` started emitting ?next=. Until
  // then every guard here was exercising code no real request could reach.
  it("preserves the destinations requireUser now produces", () => {
    for (const path of ["/billing", "/scan", "/settings/keys", "/apps/abc-123"]) {
      expect(safeNext(path)).toBe(path);
    }
  });

  it("honours an empty fallback so callers can tell 'nowhere' apart", () => {
    expect(safeNext(null, "")).toBe("");
    expect(safeNext("https://evil.com", "")).toBe("");
  });
});
