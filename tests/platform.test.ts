import { describe, it, expect } from "vitest";

import { detectPlatform } from "@/lib/scan/platform";

describe("platform detection", () => {
  it("identifies an app by the host it is deployed on", () => {
    expect(detectPlatform("<html></html>", "https://myapp.lovable.app")).toBe("lovable");
    expect(detectPlatform("<html></html>", "https://x.bolt.host")).toBe("bolt");
    expect(detectPlatform("<html></html>", "https://x.replit.app")).toBe("replit");
    expect(detectPlatform("<html></html>", "https://x.repl.co")).toBe("replit");
    expect(detectPlatform("<html></html>", "https://x.vusercontent.net")).toBe("v0");
  });

  it("identifies an app by infrastructure it actually loads", () => {
    expect(
      detectPlatform('<script src="https://cdn.gpteng.co/gptengineer.js"></script>'),
    ).toBe("lovable");
    expect(detectPlatform('<img src="/lovable-uploads/hero.png">')).toBe("lovable");
    expect(detectPlatform('<script src="https://staticblitz.com/x.js">')).toBe("bolt");
  });

  // The bug this module exists for: supabase.com lists Lovable as a customer,
  // so a bare name match filed it as a Lovable app. Any page that merely talks
  // about a builder was misattributed, which silently poisons every number we
  // might ever group by platform.
  it("does not classify a page that merely mentions a builder", () => {
    const marketing = `
      <html><body>
        <h1>Trusted by teams building with Lovable, Bolt, Replit and v0</h1>
        <p>Read our comparison of lovable vs bolt.new for shipping fast.</p>
      </body></html>`;
    expect(detectPlatform(marketing, "https://supabase.com")).toBe("unknown");
    expect(detectPlatform(marketing)).toBe("unknown");
  });

  it("prefers an honest unknown over a guess", () => {
    expect(detectPlatform("<html><body>hello</body></html>")).toBe("unknown");
    expect(detectPlatform("", "https://example.com")).toBe("unknown");
  });

  it("reads a self-declared generator tag", () => {
    expect(
      detectPlatform('<meta name="generator" content="Lovable">', "https://example.com"),
    ).toBe("lovable");
  });

  // A host that merely contains a builder's name is not that builder — the
  // suffix must be the real deploy domain.
  it("is not fooled by a lookalike hostname", () => {
    expect(detectPlatform("<html></html>", "https://lovable.app.evil.com")).toBe("unknown");
    expect(detectPlatform("<html></html>", "https://notlovable.com")).toBe("unknown");
    expect(detectPlatform("<html></html>", "https://replit.app.attacker.io")).toBe("unknown");
  });

  it("survives a malformed url without throwing", () => {
    expect(detectPlatform("<html></html>", "not a url")).toBe("unknown");
    expect(
      detectPlatform('<script src="https://cdn.gpteng.co/x.js">', "not a url"),
    ).toBe("lovable");
  });
});
