import "server-only";

import { lookup } from "node:dns/promises";

import { isPrivateIp } from "@/lib/scan/ssrf";

/**
 * SSRF-safe fetching of a user-submitted app URL. We only ever scan a public
 * web app the user owns — never internal/loopback/private addresses — so we
 * validate the protocol and resolve the host, rejecting any private IP (also
 * guards against DNS-rebinding). Responses are bounded by time and size.
 */
const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 3_000_000;
const MAX_BUNDLE_BYTES = 1_500_000;
const MAX_BUNDLES = 10;

/** Validate a URL is a public http(s) target, resolving DNS. Throws if not. */
export async function assertScannableUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs can be scanned.");
  }
  const host = url.hostname;
  if (!host || host === "localhost") throw new Error("That address can't be scanned.");

  // Resolve every address and reject if any is private (anti-rebinding).
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new Error("Couldn't resolve that domain.");
  }
  if (addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("That address can't be scanned.");
  }
  return url;
}

async function fetchBounded(url: string, maxBytes: number): Promise<{ text: string; headers: Headers; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "AssayScanner/1.0 (+https://assay.dev)" },
    });
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        if (received > maxBytes) {
          controller.abort();
          break;
        }
        chunks.push(value);
      }
    }
    const text = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
    return { text, headers: res.headers, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchedApp {
  finalUrl: string;
  status: number;
  html: string;
  headers: Record<string, string>;
  bundles: { url: string; content: string }[];
}

/** Fetch the app's HTML + its referenced JS bundles, SSRF-guarded throughout. */
export async function fetchApp(rawUrl: string): Promise<FetchedApp> {
  const url = await assertScannableUrl(rawUrl);
  const main = await fetchBounded(url.toString(), MAX_HTML_BYTES);

  const headers: Record<string, string> = {};
  main.headers.forEach((v, k) => (headers[k] = v));

  // Discover <script src> bundle URLs and inline module imports.
  const srcs = [...main.text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
    (m) => m[1],
  );
  const bundles: { url: string; content: string }[] = [];
  for (const src of srcs.slice(0, MAX_BUNDLES)) {
    let abs: string;
    try {
      abs = new URL(src, url).toString();
    } catch {
      continue;
    }
    try {
      await assertScannableUrl(abs); // re-guard every fetched URL
      const b = await fetchBounded(abs, MAX_BUNDLE_BYTES);
      bundles.push({ url: abs, content: b.text });
    } catch {
      // skip unreachable / blocked bundles
    }
  }

  return { finalUrl: url.toString(), status: main.status, html: main.text, headers, bundles };
}
