/**
 * Pure text predicates used to avoid false positives when probing for exposed
 * files. Single-page apps return their index.html (HTTP 200) for unknown paths,
 * so a 200 proves nothing — we only trust a hit when the body actually looks
 * like the file. Kept pure (no I/O) so these guards are unit-tested.
 */

/** True when text is a real dotenv file (KEY=VALUE lines), not an HTML page. */
export function looksLikeEnvFile(text: string): boolean {
  if (/<!doctype|<html|<head|<body|<script/i.test(text)) return false;
  const kv = text
    .split(/\r?\n/)
    .filter((l) => /^\s*(?:export\s+)?[A-Z][A-Z0-9_]{2,}\s*=/.test(l));
  return kv.length >= 2;
}

/** True when text is a real git config (has core + a remote section). */
export function looksLikeGitConfig(text: string): boolean {
  if (/<!doctype|<html/i.test(text)) return false;
  return /\[core\]/i.test(text) && /\[remote\s+"/i.test(text);
}

// Interstitials that answer with HTTP 200 while showing none of the real app:
// bot challenges, WAF blocks, and "coming soon" placeholders.
const CHALLENGE_MARKERS =
  /(just a moment|checking your browser|cf-browser-verification|cf_chl|attention required|enable javascript and cookies|_incapsula_|access denied|ddos protection|please verify you are a human|captcha|coming soon|under construction|site not found|no such app)/i;

/** Roughly how much visible text a real app ships in its initial HTML. */
const THIN_HTML_BYTES = 1_200;

/**
 * Whether a fetch that "succeeded" almost certainly never showed us the app.
 *
 * A Cloudflare challenge, a WAF block, a login wall, or a placeholder page all
 * answer 200 with none of the app's real content — so every check finds
 * nothing and the app would otherwise sail through as certified. Since the
 * whole product rests on the certificate meaning something, the easiest way to
 * earn one must not be to hide from the scanner.
 *
 * Deliberately conservative: an app that shipped JS bundles or exposed a
 * backend reference clearly *was* visible, whatever else the page says. Pure.
 */
export function looksUnscannable(
  html: string,
  bundleCount: number,
  hasBackendRef: boolean,
): boolean {
  if (bundleCount > 0 || hasBackendRef) return false;
  return CHALLENGE_MARKERS.test(html) || html.trim().length < THIN_HTML_BYTES;
}
