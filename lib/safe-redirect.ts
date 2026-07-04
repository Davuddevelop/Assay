/**
 * Only an internal, single-segment path is a safe post-login redirect target.
 * Rejects absolute URLs, protocol-relative paths ("//evil.com"), and the
 * classic userinfo trick ("/@evil.com") that turns `origin + next` into a
 * redirect to a different host entirely. Pure — no server dependencies, so
 * it's testable without importing the route's cookie/Supabase plumbing.
 */
export function safeNext(raw: string | null, fallback = "/dashboard"): string {
  if (raw && /^\/(?!\/)[A-Za-z0-9/_-]*$/.test(raw)) return raw;
  return fallback;
}
