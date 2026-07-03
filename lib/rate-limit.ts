/**
 * Lightweight in-memory rate limiter for the anonymous scan endpoint. Because
 * anyone can hit `/try` with any URL and our server does the fetching, this
 * stops a single visitor from hammering it (cost / scanning-proxy abuse).
 *
 * In-memory means it's per-serverless-instance, not globally exact — that's
 * fine for a "slow down" guard. A real global limit (Upstash/Vercel KV) is a
 * later upgrade if abuse warrants it.
 */
interface Hit {
  count: number;
  resetAt: number;
}

const store = new Map<string, Hit>();
const MAX_KEYS = 10_000; // bound memory; prune when exceeded

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window limiter. `now` is injectable for tests. Returns whether the call
 * is allowed plus how long until the window resets.
 */
export function rateLimit(
  key: string,
  limit = 6,
  windowMs = 60_000,
  now: number = Date.now(),
): RateResult {
  if (store.size > MAX_KEYS) {
    for (const [k, v] of store) if (now > v.resetAt) store.delete(k);
  }

  const hit = store.get(key);
  if (!hit || now > hit.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (hit.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) };
  }
  hit.count += 1;
  return { ok: true, remaining: limit - hit.count, retryAfterSec: 0 };
}
