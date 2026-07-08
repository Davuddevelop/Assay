import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only throws when imported outside Next's server bundling; no-op it
// so we can exercise the real runScan() pipeline end-to-end.
vi.mock("server-only", () => ({}));

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

const { runScan } = await import("@/lib/scan/run");

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** A JWT-shaped (but fake, unsigned) Supabase anon key that decodes role: "anon". */
const FAKE_ANON_KEY = [
  b64url({ alg: "HS256", typ: "JWT" }),
  b64url({ role: "anon", iss: "supabase", exp: 9999999999 }),
  "fakesignature1234567890",
].join(".");

const NO_SECURITY_HEADERS = { "content-type": "text/html" };
const ALL_SECURITY_HEADERS = {
  "content-type": "text/html",
  "content-security-policy": "default-src 'self'",
  "strict-transport-security": "max-age=63072000",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
};

function html(body: string) {
  return new Response(body, { status: 200, headers: NO_SECURITY_HEADERS });
}

/** Router simulating two real, contrasting live apps + their backing APIs. */
function buildFetchRouter() {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";

    // ── the vulnerable app: leaked secret, RLS off, open storage, no headers ──
    if (url === "https://vulnerable.test/") {
      return new Response(
        `<html><head></head><body>
          <script src="/assets/bundle.js"></script>
          <script>window.SUPABASE_URL="https://abcdefgh.supabase.co";window.SUPABASE_ANON_KEY="${FAKE_ANON_KEY}";</script>
        </body></html>`,
        { status: 200, headers: NO_SECURITY_HEADERS },
      );
    }
    if (url === "https://vulnerable.test/assets/bundle.js") {
      return new Response(`const stripeKey = "sk_live_${"A".repeat(30)}";`, {
        status: 200,
        headers: { "content-type": "application/javascript" },
      });
    }
    if (url === "https://abcdefgh.supabase.co/rest/v1/") {
      return new Response(JSON.stringify({ paths: { "/profiles": {} } }), { status: 200 });
    }
    if (url === "https://abcdefgh.supabase.co/rest/v1/profiles?select=*&limit=1") {
      return new Response(JSON.stringify([{ id: 1, email: "leaked@example.com" }]), { status: 200 });
    }
    if (method === "POST" && url === "https://abcdefgh.supabase.co/storage/v1/object/list/avatars") {
      return new Response(JSON.stringify([{ name: "user-1234.jpg" }]), { status: 200 });
    }
    if (method === "POST" && url.startsWith("https://abcdefgh.supabase.co/storage/v1/object/list/")) {
      return new Response(JSON.stringify({ error: "not found" }), { status: 400 });
    }
    if (url.startsWith("https://vulnerable.test/.env") || url.startsWith("https://vulnerable.test/.git/")) {
      return new Response("not found", { status: 404 });
    }

    // ── the clean app: no secrets, RLS-safe (no Supabase ref), full headers ──
    if (url === "https://clean.test/") {
      return html(`<html><head></head><body><script src="/assets/main.js"></script></body></html>`);
    }
    if (url === "https://clean.test/assets/main.js") {
      return new Response(`console.log("hello world");`, {
        status: 200,
        headers: { "content-type": "application/javascript" },
      });
    }
    if (url.startsWith("https://clean.test/.env") || url.startsWith("https://clean.test/.git/")) {
      return new Response("not found", { status: 404 });
    }

    throw new Error(`unexpected fetch in test: ${method} ${url}`);
  });
}

// clean.test's headers need to come from the MAIN document response, not the
// router default — patch it in after construction to keep the router terse.
function withCleanHeaders(fetchSpy: ReturnType<typeof buildFetchRouter>) {
  const original = fetchSpy.getMockImplementation()!;
  fetchSpy.mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "https://clean.test/") {
      return new Response(
        `<html><head></head><body><script src="/assets/main.js"></script></body></html>`,
        { status: 200, headers: ALL_SECURITY_HEADERS },
      );
    }
    return original(input, init);
  });
}

describe("runScan — end-to-end against two contrasting simulated live apps", () => {
  beforeEach(() => {
    lookupMock.mockReset();
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]); // always "public"
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("flags real, distinct issues on a genuinely vulnerable app", async () => {
    vi.stubGlobal("fetch", buildFetchRouter());

    const result = await runScan("https://vulnerable.test/");

    const kinds = result.findings.map((f) => f.kind).sort();
    expect(kinds).toContain("exposed-secret");
    expect(kinds).toContain("supabase-rls");
    expect(kinds).toContain("supabase-storage");
    expect(kinds).toContain("missing-header");
    expect(result.verdict).toBe("at_risk");
    expect(result.score).toBeLessThan(50);
  });

  it("certifies a genuinely clean app with different findings than the vulnerable one", async () => {
    const fetchSpy = buildFetchRouter();
    withCleanHeaders(fetchSpy);
    vi.stubGlobal("fetch", fetchSpy);

    const result = await runScan("https://clean.test/");

    expect(result.findings).toHaveLength(0);
    expect(result.verdict).toBe("certified");
    expect(result.score).toBe(100);
  });

  it("is deterministic: scanning the same app twice gives byte-identical findings and score", async () => {
    vi.stubGlobal("fetch", buildFetchRouter());

    const first = await runScan("https://vulnerable.test/");
    const second = await runScan("https://vulnerable.test/");

    // created_at/etc aren't part of RawFinding, so a straight deep-equal is fair.
    expect(second).toEqual(first);
  });

  it("gives different apps different scores — it isn't returning a canned result", async () => {
    const vulnFetch = buildFetchRouter();
    vi.stubGlobal("fetch", vulnFetch);
    const vulnResult = await runScan("https://vulnerable.test/");

    const cleanFetch = buildFetchRouter();
    withCleanHeaders(cleanFetch);
    vi.stubGlobal("fetch", cleanFetch);
    const cleanResult = await runScan("https://clean.test/");

    expect(vulnResult.score).not.toBe(cleanResult.score);
    expect(vulnResult.verdict).not.toBe(cleanResult.verdict);
  });
});
