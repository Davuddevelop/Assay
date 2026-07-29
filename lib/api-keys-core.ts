import { createHash, randomBytes } from "node:crypto";

/**
 * The pure half of API keys — format, hashing, and credential parsing.
 *
 * We store only the SHA-256 hash. The plaintext is returned exactly once, at
 * creation, and is unrecoverable afterwards; if this table leaks, it leaks
 * hashes. A plain hash (not a slow KDF) is the right choice here and not a
 * shortcut: these are 256 bits of `randomBytes`, so there is no dictionary to
 * run against them, and the lookup is on the hot path of every agent request.
 *
 * Split out from `lib/api-keys.ts` so these can be unit-tested — that module
 * imports `server-only`, which is unresolvable under Vitest.
 */
const PREFIX = "assay_sk_";
/** Enough of the key to recognise it in a list, never enough to use it. */
const DISPLAY_CHARS = PREFIX.length + 6;

/** Format check only — says nothing about whether a key is real. */
export function looksLikeApiKey(value: string): boolean {
  return new RegExp(`^${PREFIX}[A-Za-z0-9_-]{32,}$`).test(value);
}

/** Stable lookup hash for a key. */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** The shown-in-the-UI stub of a key. */
export function keyPrefix(key: string): string {
  return key.slice(0, DISPLAY_CHARS);
}

/** A fresh key. 256 bits of entropy, url-safe. */
export function generateApiKey(): string {
  return PREFIX + randomBytes(32).toString("base64url");
}

/**
 * Extract a bearer token from an Authorization header. Returns null for
 * anything that isn't a well-formed bearer credential.
 */
export function bearerFrom(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
