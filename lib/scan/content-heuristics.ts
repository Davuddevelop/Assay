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
