/**
 * Pure helpers for finding the JavaScript an app actually ships to the browser.
 *
 * The Supabase anon key (and other client secrets) usually live in a bundled JS
 * chunk, NOT in the page HTML. Vite/Next apps — exactly what Lovable, Bolt, v0
 * and Replit emit — reference those chunks three ways: a `<script src>` entry,
 * `<link rel="modulepreload">` / `<link rel="preload" as="script">` hints, and
 * imports *from inside* one chunk to another. We must follow all three or we
 * miss the key and wrongly report the app as clean.
 *
 * These functions are pure (no I/O) so the detection path is unit-testable.
 */

/** URLs (possibly relative) of JS the HTML tells the browser to load. */
export function discoverBundleUrls(html: string): string[] {
  const urls: string[] = [];

  // <script ... src="...">
  for (const m of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    urls.push(m[1]);
  }

  // <link rel="modulepreload" href="..."> and <link rel="preload" as="script" href="...">
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    const as = tag.match(/\bas=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (rel.includes("modulepreload") || (rel.includes("preload") && as === "script")) {
      urls.push(href);
    }
  }

  return [...new Set(urls)];
}

/**
 * JS chunk references found *inside* a bundle (one level deeper). We only follow
 * paths under the conventional build-output dirs so we don't chase every `.js`
 * string — that keeps the crawl bounded and avoids third-party noise.
 */
export function discoverChunkRefs(js: string): string[] {
  const refs = new Set<string>();
  for (const m of js.matchAll(
    /["'`]([^"'`]*?(?:assets|chunks|_next|static)\/[^"'`]+?\.js)["'`]/gi,
  )) {
    refs.add(m[1]);
  }
  return [...refs];
}

/** True when a bundle ships a source-map reference (original source recoverable). */
export function hasSourceMapRef(js: string): boolean {
  return /\/\/[#@]\s*sourceMappingURL=\S+\.map/.test(js);
}
