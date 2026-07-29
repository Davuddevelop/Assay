import { describe, it, expect } from "vitest";

import { isPrefillable, PREFILL_MAX_AGE } from "@/lib/scan/prefill";
import { safeNext } from "@/lib/safe-redirect";

describe("carrying a scanned app across sign-in", () => {
  it("carries an ordinary app url", () => {
    expect(isPrefillable("https://myapp.lovable.app")).toBe(true);
    expect(isPrefillable("http://localhost:3000")).toBe(true);
    expect(isPrefillable("  https://myapp.vercel.app/dash  ")).toBe(true);
  });

  it("refuses anything that isn't an http url", () => {
    for (const bad of [
      "",
      "   ",
      "myapp.lovable.app",
      "javascript:alert(1)",
      "data:text/html,<script>",
      "file:///etc/passwd",
    ]) {
      expect(isPrefillable(bad)).toBe(false);
    }
  });

  it("refuses an absurdly long value", () => {
    expect(isPrefillable(`https://a.com/${"x".repeat(3000)}`)).toBe(false);
  });

  // The cookie exists so someone doesn't retype a url mid-signup. If it
  // outlived that, a scan box would silently prefill days later.
  it("expires within one sign-in round trip", () => {
    expect(PREFILL_MAX_AGE).toBeGreaterThanOrEqual(60);
    expect(PREFILL_MAX_AGE).toBeLessThanOrEqual(60 * 30);
  });

  // The url travels in a cookie precisely so `safeNext` can stay strict. If it
  // ever started accepting query strings, a crafted login link could preload
  // someone else's scan box — this pins that shut.
  it("keeps the post-login redirect free of attacker-supplied query strings", () => {
    expect(safeNext("/scan?prefill=https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/@evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("/scan")).toBe("/scan");
  });

  it("falls back to where the caller says, not always the dashboard", () => {
    expect(safeNext(null, "/scan")).toBe("/scan");
    expect(safeNext("https://evil.com", "/scan")).toBe("/scan");
  });
});
