import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The real module throws when imported outside Next's server bundling; no-op
// it here so we can exercise fetchApp directly.
vi.mock("server-only", () => ({}));

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

const { fetchApp } = await import("@/lib/scan/fetch");

describe("fetchApp — SSRF-via-redirect guard", () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a redirect to a private/internal address instead of following it", async () => {
    lookupMock.mockImplementation(async (host: string) => {
      if (host === "internal.test") return [{ address: "169.254.169.254", family: 4 }];
      return [{ address: "93.184.216.34", family: 4 }]; // the attacker's own public server
    });

    const fetchSpy = vi.fn(async (url: string) => {
      if (url === "https://public-attacker.test/") {
        return new Response(null, {
          status: 302,
          headers: { location: "http://internal.test/latest/meta-data" },
        });
      }
      throw new Error(`must never fetch the redirect target: ${url}`);
    });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchApp("https://public-attacker.test/")).rejects.toThrow();
    // The internal target must never have been requested.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("still follows a legitimate same-scope redirect and reports the final URL", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    const fetchSpy = vi.fn(async (url: string) => {
      if (url === "https://example.test/") {
        return new Response(null, {
          status: 301,
          headers: { location: "https://example.test/app" },
        });
      }
      return new Response("<html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchApp("https://example.test/");
    expect(result.finalUrl).toBe("https://example.test/app");
    expect(result.status).toBe(200);
  });

  it("gives up after too many redirect hops instead of looping forever", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    let hop = 0;
    const fetchSpy = vi.fn(async () => {
      hop += 1;
      return new Response(null, {
        status: 302,
        headers: { location: `https://example.test/hop-${hop}` },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    await expect(fetchApp("https://example.test/")).rejects.toThrow(/redirected too many times/);
  });
});
