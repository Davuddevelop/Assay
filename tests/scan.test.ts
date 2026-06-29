import { describe, it, expect } from "vitest";

import { scanText } from "@/lib/scan/patterns";
import { isPrivateIp } from "@/lib/scan/ssrf";
import { detectSupabase, decodeJwtRole } from "@/lib/scan/supabase-detect";
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
