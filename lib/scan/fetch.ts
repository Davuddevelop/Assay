import "server-only";

import { lookup } from "node:dns/promises";

import { isPrivateIp } from "@/lib/scan/ssrf";
import { discoverBundleUrls, discoverChunkRefs } from "@/lib/scan/bundles";

/**
 * SSRF-safe fetching of a user-submitted app URL. We only ever scan a public
 * web app the user owns — never internal/loopback/private addresses — so we
 * validate the protocol and resolve the host, rejecting any private IP (also
 * guards against DNS-rebinding). Responses are bounded by time and size.
 */
const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 3_000_000;
const MAX_BUNDLE_BYTES = 1_500_000;
const MAX_BUNDLES = 12;
const BUNDLE_CRAWL_BUDGET_MS = 12_000;
const MAX_REDIRECTS = 5;

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

async function fetchOnce(
  url: string,
  maxBytes: number,
): Promise<{ text: string; headers: Headers; status: number; location: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual", // never let the runtime auto-follow — see fetchBounded
      headers: { "user-agent": "AssayScanner/1.0 (+https://assay.dev)" },
    });
    if (res.status >= 300 && res.status < 400) {
      return { text: "", headers: res.headers, status: res.status, location: res.headers.get("location") };
    }
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
    return { text, headers: res.headers, status: res.status, location: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a URL, following redirects ourselves so every hop is re-validated by
 * the SSRF guard. `fetch(url, { redirect: "follow" })` would let a malicious
 * server 302 straight to an internal address (cloud metadata, localhost) that
 * the pre-redirect check on the original URL never sees.
 */
async function fetchBounded(
  startUrl: URL,
  maxBytes: number,
): Promise<{ text: string; headers: Headers; status: number; finalUrl: URL }> {
  let current = startUrl;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const res = await fetchOnce(current.toString(), maxBytes);
    if (res.location === null) {
      return { text: res.text, headers: res.headers, status: res.status, finalUrl: current };
    }
    let next: URL;
    try {
      next = new URL(res.location, current);
    } catch {
      throw new Error("That app redirected somewhere invalid.");
    }
    current = await assertScannableUrl(next.toString()); // re-guard every hop
  }
  throw new Error("That app redirected too many times.");
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
  const main = await fetchBounded(url, MAX_HTML_BYTES);

  // Never certify an error/placeholder page: if the app didn't return a real
  // 200, we couldn't actually reach it — surface that instead of a false pass.
  if (main.status >= 400) {
    throw new Error(
      `We couldn't reach that app — it returned HTTP ${main.status}. Check the URL is live and public.`,
    );
  }

  const headers: Record<string, string> = {};
  main.headers.forEach((v, k) => (headers[k] = v));

  // Crawl the JS the app ships: <script src> + preloaded module chunks from the
  // HTML, then one level of chunk-to-chunk imports found inside those bundles —
  // the Supabase anon key commonly lives in a preloaded or secondary chunk.
  const bundles: { url: string; content: string }[] = [];
  const seen = new Set<string>();
  const queue: string[] = [];
  const enqueue = (ref: string, base: string) => {
    try {
      queue.push(new URL(ref, base).toString());
    } catch {
      /* unresolvable ref */
    }
  };

  for (const src of discoverBundleUrls(main.text)) enqueue(src, main.finalUrl.toString());

  // Hard ceiling on the whole crawl — a slow CDN can't stall the scan.
  const crawlDeadline = Date.now() + BUNDLE_CRAWL_BUDGET_MS;
  while (queue.length > 0 && bundles.length < MAX_BUNDLES && Date.now() < crawlDeadline) {
    const abs = queue.shift()!;
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      const bundleUrl = await assertScannableUrl(abs); // re-guard every fetched URL (SSRF)
      const b = await fetchBounded(bundleUrl, MAX_BUNDLE_BYTES);
      bundles.push({ url: abs, content: b.text });
      // Follow deeper chunk imports, but only same-origin (the app's own code).
      for (const ref of discoverChunkRefs(b.text)) {
        const resolved = (() => {
          try {
            return new URL(ref, abs);
          } catch {
            return null;
          }
        })();
        if (resolved && resolved.origin === url.origin) enqueue(resolved.toString(), abs);
      }
    } catch {
      // skip unreachable / blocked bundles
    }
  }

  return { finalUrl: main.finalUrl.toString(), status: main.status, html: main.text, headers, bundles };
}
