import { describe, it, expect } from "vitest";

import { scanText } from "@/lib/scan/patterns";
import { checkHeaders } from "@/lib/scan/headers";
import { hasSourceMapRef } from "@/lib/scan/bundles";
import type { RawFinding } from "@/lib/scan/types";

/**
 * Scanner accuracy harness — a holistic, app-level guard against the two things
 * that kill trust in a security tool: false negatives (missing a real hole) and
 * false positives (crying wolf on a safe app). It runs the deterministic
 * (non-network) checks the way runScan composes them, over two REALISTIC whole
 * apps: one deliberately vulnerable, one genuinely clean.
 *
 * The network probes (Supabase RLS/storage, exposed files) are validated by
 * their own parser tests; this pins the code/header verdict end to end so a
 * change to any pattern can't silently regress the false-positive rate.
 */

// A realistic vibe-coded bundle that leaks: a Supabase SERVICE key (not the
// public anon key) and a live Stripe secret, and ships a source map.
const SERVICE_ROLE_JWT = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
  JSON.stringify({ role: "service_role", iss: "supabase" }),
).toString("base64url")}.s1gnatureXXXXXXXXXX`;
const ANON_JWT = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(
  JSON.stringify({ role: "anon", iss: "supabase" }),
).toString("base64url")}.s1gnatureYYYYYYYYYY`;

const VULN_BUNDLE = `
"use strict";
const sb = createClient("https://abcd1234.supabase.co", "${SERVICE_ROLE_JWT}");
const stripe = Stripe("sk_live_${"A".repeat(30)}");
function pay(o){return stripe.charges.create(o);}
//# sourceMappingURL=index-a8f3.js.map
`;
const VULN_HTML = `<!doctype html><html><head><title>My SaaS</title></head><body><script src="/assets/index-a8f3.js"></script></body></html>`;
const VULN_HEADERS: Record<string, string> = {
  "content-type": "text/html",
  server: "vercel",
};

// A realistic clean app: only the public anon + publishable keys (meant to ship
// to the browser), no source map, and a full set of security headers.
const CLEAN_BUNDLE = `
"use strict";
const sb = createClient("https://abcd1234.supabase.co", "${ANON_JWT}");
const stripe = Stripe("pk_live_${"B".repeat(24)}");
const PUBLIC_KEY = "sb_publishable_${"c".repeat(16)}";
function greet(name){return "hi " + name;}
`;
const CLEAN_HTML = `<!doctype html><html><head><title>My SaaS</title></head><body><script src="/assets/index-b1c2.js"></script></body></html>`;
const CLEAN_HEADERS: Record<string, string> = {
  "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
};

/** Compose the deterministic (code + header + sourcemap) checks like runScan. */
function codeVerdict(html: string, bundle: string, headers: Record<string, string>) {
  const findings: RawFinding[] = [
    ...scanText(html, "page HTML"),
    ...scanText(bundle, "bundle"),
    ...checkHeaders(headers),
  ];
  if (hasSourceMapRef(bundle)) {
    findings.push({
      kind: "open-endpoint",
      severity: "minor",
      title: "Your source code is downloadable",
      detail: "",
      redactedLocation: null,
    });
  }
  return findings;
}

describe("scanner accuracy — vulnerable app (no false negatives)", () => {
  const findings = codeVerdict(VULN_HTML, VULN_BUNDLE, VULN_HEADERS);
  const kinds = findings.map((f) => f.kind);

  it("catches the exposed service key as critical", () => {
    const serviceKey = findings.find((f) => /service key/i.test(f.title));
    expect(serviceKey).toBeTruthy();
    expect(serviceKey?.kind).toBe("exposed-secret");
    expect(serviceKey?.severity).toBe("critical");
  });

  it("catches the live Stripe secret", () => {
    const secrets = findings.filter((f) => f.kind === "exposed-secret");
    expect(secrets.length).toBeGreaterThanOrEqual(2);
  });

  it("flags missing security headers and the downloadable source map", () => {
    expect(kinds).toContain("missing-header");
    expect(findings.some((f) => f.title === "Your source code is downloadable")).toBe(true);
  });

  it("never leaks a secret value into a finding (redaction invariant)", () => {
    for (const f of findings) {
      expect(f.redactedLocation ?? "").not.toContain(SERVICE_ROLE_JWT);
      expect(f.redactedLocation ?? "").not.toContain("sk_live_");
    }
  });
});

describe("scanner accuracy — clean app (no false positives)", () => {
  const findings = codeVerdict(CLEAN_HTML, CLEAN_BUNDLE, CLEAN_HEADERS);

  it("does not flag the public anon or publishable keys as secrets", () => {
    expect(findings.filter((f) => f.kind === "exposed-secret")).toEqual([]);
  });

  it("does not flag headers when the full set is present", () => {
    expect(findings.filter((f) => f.kind === "missing-header")).toEqual([]);
  });

  it("produces a completely clean verdict", () => {
    expect(findings).toEqual([]);
  });
});
