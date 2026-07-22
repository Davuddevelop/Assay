import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Security headers applied to every route. Assay scans other apps for exactly
// these — so it sets them on itself. The CSP carries only hardening directives
// that don't constrain scripts/styles/connections. A nonce'd `script-src` was
// tried in middleware.ts and reverted: verified with a real browser that
// Next 16 + Turbopack doesn't propagate the nonce to its own chunk or inline
// hydration scripts here, so the app never rendered — a real gap, not yet
// resolved. `frame-ancestors` + `X-Frame-Options` both block clickjacking.
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
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
      {
        // Page documents only (never /_next/static, which is hashed +
        // immutable and should stay aggressively cached). Forces a
        // revalidation on every navigation instead of letting the browser
        // serve a stale HTML shell from a previous deploy against the
        // current JS bundle — that mismatch is what caused the old landing
        // page to flash before snapping to the current one after a route
        // swap (a stale-HTML-vs-fresh-hydration mismatch, not a real bug in
        // either page). Cheap insurance against it recurring on any future
        // deploy for a first-time visitor.
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
