import type { RawFinding } from "@/lib/scan/types";

interface HeaderCheck {
  header: string;
  title: string;
  detail: string;
}

const CHECKS: HeaderCheck[] = [
  {
    header: "content-security-policy",
    title: "No Content-Security-Policy",
    detail:
      "The app has no Content-Security-Policy header, which helps block injected/malicious scripts (XSS).",
  },
  {
    header: "strict-transport-security",
    title: "No HSTS (forced HTTPS)",
    detail:
      "Without Strict-Transport-Security, browsers may load the site over insecure HTTP.",
  },
  {
    header: "x-frame-options",
    title: "Page can be embedded in an iframe",
    detail:
      "Missing X-Frame-Options (or frame-ancestors) allows clickjacking via embedding.",
  },
  {
    header: "x-content-type-options",
    title: "No MIME-sniffing protection",
    detail: "Missing X-Content-Type-Options: nosniff allows content-type confusion attacks.",
  },
];

/** Report missing security headers (defense-in-depth → minor severity). */
export function checkHeaders(headers: Record<string, string>): RawFinding[] {
  const present = new Set(Object.keys(headers).map((h) => h.toLowerCase()));
  // CSP via frame-ancestors also satisfies clickjacking protection.
  const csp = headers["content-security-policy"]?.toLowerCase() ?? "";

  return CHECKS.filter((c) => {
    if (present.has(c.header)) return false;
    if (c.header === "x-frame-options" && csp.includes("frame-ancestors")) return false;
    return true;
  }).map((c) => ({
    kind: "missing-header",
    severity: "minor",
    title: c.title,
    detail: c.detail,
    redactedLocation: "HTTP response headers",
  }));
}
