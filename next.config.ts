import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Security headers applied to every route. Assay scans other apps for exactly
// these — so it sets them on itself. The CSP carries only hardening directives
// that don't constrain scripts/styles/connections (so Next's inline bootstrap,
// GSAP, and Supabase calls keep working); a fuller nonce-based CSP is a later
// hardening. `frame-ancestors` + `X-Frame-Options` both block clickjacking.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't infer a parent directory when other
  // lockfiles exist higher up the tree.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
