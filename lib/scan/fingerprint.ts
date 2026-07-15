import { createHash } from "node:crypto";

/**
 * A cheap, stable fingerprint of what an app is serving — used to detect when
 * someone actually ships a change (the "you just pushed something" moment), so
 * monitoring only runs a full re-scan when the app really changed.
 *
 * The strongest signal is the set of JS bundle URLs: every AI builder (Vite /
 * Next / Lovable / Bolt) content-hashes its bundle filenames, so they change on
 * every rebuild but stay identical across reloads of the same build. We hash
 * those. If the page ships no bundles, we fall back to whitespace-normalized
 * HTML. Pure — unit-tested.
 */
export function computeFingerprint(html: string, bundleUrls: string[]): string {
  const basis =
    bundleUrls.length > 0
      ? [...bundleUrls].sort().join("\n")
      : html.replace(/\s+/g, " ").trim();
  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}
