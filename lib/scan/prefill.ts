/**
 * Carrying a scanned app across sign-in.
 *
 * Someone scans anonymously, decides to continue, and signs in — and without
 * this they land on an empty box and have to remember and retype the URL they
 * just used. That retype is where they leave.
 *
 * It travels in a short-lived httpOnly cookie rather than a query string on the
 * post-login `next`: `safeNext` deliberately refuses query strings so a crafted
 * link can't steer where a login lands, and widening it to carry this would
 * also hand an attacker a way to preload someone else's scan box. Pure — no
 * server imports, so the validation is testable on its own.
 */
export const PREFILL_COOKIE = "assay_prefill";

/** Fifteen minutes: long enough for a GitHub round trip, short enough to be gone. */
export const PREFILL_MAX_AGE = 60 * 15;

/**
 * Is this worth carrying? A cheap syntactic check only — the real SSRF and
 * reachability rules are applied by `assertScannableUrl` when a scan actually
 * runs, and are not duplicated here.
 */
export function isPrefillable(raw: string): boolean {
  const value = raw.trim();
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
