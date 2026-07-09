import { describe, it, expect } from "vitest";

import { scanText } from "@/lib/scan/patterns";
import { isPrivateIp } from "@/lib/scan/ssrf";
import {
  detectSupabase,
  decodeJwtRole,
  tablesFromOpenApi,
  isExposedResponse,
  isExposedBucketListing,
  columnsFromRow,
  sensitiveColumns,
} from "@/lib/scan/supabase-detect";
import { discoverBundleUrls, discoverChunkRefs, hasSourceMapRef } from "@/lib/scan/bundles";
import { looksLikeEnvFile, looksLikeGitConfig } from "@/lib/scan/content-heuristics";
import { scoreFindings } from "@/lib/scan/score";
import { checkHeaders } from "@/lib/scan/headers";

describe("scanText (secret detection)", () => {
  it("flags an exposed Stripe secret key, redacted (never the value)", () => {
    const key = "sk_live_" + "A".repeat(30);
    const out = scanText(`const k="${key}"`, "bundle.js");
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("critical");
    expect(out[0].redactedLocation).not.toContain(key);
  });

  it("ignores clean code", () => {
    expect(scanText("const sum = a + b;", "bundle.js")).toEqual([]);
  });

  it("de-duplicates the same rule within a source", () => {
    const text = "AKIAABCDEFGHIJKLMNOP AKIAZZZZZZZZZZZZZZZZ";
    expect(scanText(text, "x").length).toBe(1);
  });

  it("does NOT flag the normal Supabase anon key (it is meant to be public)", () => {
    const anonPayload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
    const anonJwt = `eyJhbGciOiJIUzI1NiJ9.${anonPayload}.abcdefghij`;
    expect(scanText(`supabaseKey="${anonJwt}"`, "bundle.js")).toEqual([]);
  });

  it("flags an exposed service_role key as critical", () => {
    const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
    const jwt = `eyJhbGciOiJIUzI1NiJ9.${payload}.abcdefghij`;
    const out = scanText(`const k="${jwt}"`, "bundle.js");
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("critical");
    expect(out[0].title).toMatch(/service key/i);
  });

  it("flags newer key formats (SendGrid, Slack)", () => {
    const sg = "SG." + "A".repeat(22) + "." + "B".repeat(22);
    expect(scanText(`k="${sg}"`, "x")[0]?.title).toMatch(/SendGrid/i);
    expect(scanText(`k="xoxb-${"1".repeat(20)}"`, "x")[0]?.title).toMatch(/Slack/i);
  });

  it("does NOT flag public keys (the trust-killer false positives)", () => {
    // bare apiKey/token names are usually publishable — not flagged
    expect(scanText(`apiKey: "pk_live_public_ok_1234567890"`, "x")).toEqual([]);
    expect(scanText(`const token = "some-public-token-value"`, "x")).toEqual([]);
    // Supabase publishable / anon under any name
    expect(scanText(`supabaseKey: "sb_publishable_abcdef1234567"`, "x")).toEqual([]);
    expect(scanText(`clientSecret: "publishable_abcdefghijkl"`, "x")).toEqual([]);
  });

  it("still flags a real private secret", () => {
    const out = scanText(`client_secret: "a1b2c3d4e5f6g7h8i9j0"`, "x");
    expect(out).toHaveLength(1);
    expect(out[0].title).toMatch(/hardcoded secret/i);
  });
});

describe("isPrivateIp (SSRF guard)", () => {
  it("blocks loopback / private / link-local", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "172.16.9.9", "169.254.1.1", "::1", "fd00::1"]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "203.0.113.5"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
  });
});

describe("supabase detection", () => {
  it("finds project URL + key", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.abcdefghij";
    const ref = detectSupabase(`fetch("https://abcd1234.supabase.co", {apikey:"${jwt}"})`);
    expect(ref?.url).toBe("https://abcd1234.supabase.co");
    expect(ref?.anonKey).toBe(jwt);
  });
  it("returns null without supabase", () => {
    expect(detectSupabase("const x = 1")).toBeNull();
  });
  it("decodes the JWT role", () => {
    const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
    expect(decodeJwtRole(`eyJhbGciOiJIUzI1NiJ9.${payload}.sig`)).toBe("service_role");
  });
});

describe("bundle discovery (where the anon key actually hides)", () => {
  it("finds script src, modulepreload, and preload-as-script chunks", () => {
    const html = `
      <link rel="modulepreload" href="/assets/supabase-9f8.js">
      <link rel="preload" as="script" href="/assets/vendor-1a2.js">
      <link rel="stylesheet" href="/assets/index.css">
      <link rel="icon" href="/favicon.ico">
      <script type="module" src="/assets/index-abc.js"></script>
    `;
    const urls = discoverBundleUrls(html);
    expect(urls).toContain("/assets/index-abc.js");
    expect(urls).toContain("/assets/supabase-9f8.js");
    expect(urls).toContain("/assets/vendor-1a2.js");
    // not the stylesheet or the icon
    expect(urls).not.toContain("/assets/index.css");
    expect(urls).not.toContain("/favicon.ico");
  });

  it("does not invent bundles for clean HTML", () => {
    expect(discoverBundleUrls("<html><body>hi</body></html>")).toEqual([]);
  });

  it("follows one level of in-JS chunk imports under build dirs", () => {
    const js = `import("/assets/supabase-client-77.js");a="/_next/static/chunks/42.js";b="https://cdn.tld/x.js";c="notes.js"`;
    const refs = discoverChunkRefs(js);
    expect(refs).toContain("/assets/supabase-client-77.js");
    expect(refs).toContain("/_next/static/chunks/42.js");
    // bare / third-party paths without a build dir are ignored (low noise)
    expect(refs).not.toContain("notes.js");
  });
});

describe("exposed-file guards (must not false-positive on SPA catch-all HTML)", () => {
  it("flags a real .env, not an HTML page", () => {
    expect(looksLikeEnvFile("STRIPE_SECRET_KEY=sk_live_x\nDATABASE_URL=postgres://y")).toBe(true);
    expect(looksLikeEnvFile("<!doctype html><html><body>App</body></html>")).toBe(false);
    expect(looksLikeEnvFile("just some text\nnothing here")).toBe(false);
  });
  it("flags a real git config, not HTML", () => {
    expect(looksLikeGitConfig('[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = x')).toBe(true);
    expect(looksLikeGitConfig("<html><head></head></html>")).toBe(false);
  });
  it("detects a shipped source map", () => {
    expect(hasSourceMapRef("code;\n//# sourceMappingURL=index-abc.js.map")).toBe(true);
    expect(hasSourceMapRef("const x = 1;")).toBe(false);
  });
});

describe("RLS exposure decision (the make-or-break logic)", () => {
  it("enumerates tables from the PostgREST OpenAPI, dropping root + rpc", () => {
    const spec = { paths: { "/": {}, "/profiles": {}, "/orders": {}, "/rpc/do_thing": {} } };
    expect(tablesFromOpenApi(spec)).toEqual(["profiles", "orders"]);
  });

  it("returns no tables for a non-spec body", () => {
    expect(tablesFromOpenApi(null)).toEqual([]);
    expect(tablesFromOpenApi({ message: "JWT expired" })).toEqual([]);
  });

  it("flags a table only when an unauth read returns rows", () => {
    expect(isExposedResponse(200, [{ id: 1 }])).toBe(true); // RLS off → exposed
    expect(isExposedResponse(200, [])).toBe(false); // empty → protected/empty
    expect(isExposedResponse(401, { message: "no" })).toBe(false); // blocked
    expect(isExposedResponse(200, { count: 1 })).toBe(false); // not an array
    expect(isExposedResponse(0, null)).toBe(false); // unreachable/timeout → not exposed
  });
});

describe("exposed-data evidence (schema only, never values)", () => {
  it("reads column names from the first row and nothing else", () => {
    expect(columnsFromRow([{ id: 1, email: "a@b.com", phone: "555" }])).toEqual([
      "id",
      "email",
      "phone",
    ]);
    expect(columnsFromRow([])).toEqual([]);
    expect(columnsFromRow(null)).toEqual([]);
    expect(columnsFromRow({ id: 1 })).toEqual([]); // not an array → nothing
  });

  it("surfaces the columns a non-coder would find alarming", () => {
    const cols = ["id", "created_at", "email", "stripe_customer_id", "slug"];
    expect(sensitiveColumns(cols)).toEqual(["email", "stripe_customer_id"]);
  });
});

describe("storage exposure decision (bucket listing)", () => {
  it("flags a bucket only when an unauth list returns objects", () => {
    expect(isExposedBucketListing(200, 3)).toBe(true); // listable → exposed
    expect(isExposedBucketListing(200, 0)).toBe(false); // empty → protected/empty
    expect(isExposedBucketListing(400, 0)).toBe(false); // blocked
    expect(isExposedBucketListing(0, 0)).toBe(false); // unreachable/timeout → not exposed
  });
});

describe("scoreFindings", () => {
  it("certifies only when no critical and no risky", () => {
    expect(scoreFindings([]).verdict).toBe("certified");
    expect(scoreFindings([{ severity: "minor" }]).verdict).toBe("certified");
    expect(scoreFindings([{ severity: "risky" }]).verdict).toBe("at_risk");
    expect(scoreFindings([{ severity: "critical" }]).verdict).toBe("at_risk");
  });
  it("lowers the score by severity, clamped to 0", () => {
    expect(scoreFindings([{ severity: "minor" }]).score).toBe(94);
    expect(scoreFindings([{ severity: "critical" }, { severity: "critical" }, { severity: "critical" }]).score).toBe(0);
  });
});

describe("checkHeaders", () => {
  it("reports missing security headers as minor", () => {
    const out = checkHeaders({});
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((f) => f.severity === "minor")).toBe(true);
  });
  it("passes when all are present", () => {
    expect(
      checkHeaders({
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=63072000",
        "x-frame-options": "DENY",
        "x-content-type-options": "nosniff",
      }),
    ).toEqual([]);
  });
});
