import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

/**
 * Global rate limit — authoritative across all serverless instances, backed by
 * the `consume_rate_limit` Postgres function (one atomic upsert). Use this on
 * anything that triggers an outbound fetch from a public/anonymous surface,
 * where the per-instance in-memory limiter (lib/rate-limit.ts) barely limits.
 *
 * Defense in depth: the cheap in-memory limiter runs first (catches bursts
 * hitting one instance without a DB round-trip), then the DB limiter is the
 * global source of truth. If Supabase isn't configured, we degrade to the
 * in-memory result rather than fail open.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  // Fast local gate — if this instance alone already blew the budget, stop here.
  if (!rateLimit(key, limit, windowSec * 1000).ok) return false;

  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSec,
    });
    if (error) throw error;
    return data === true;
  } catch {
    // No Supabase / RPC missing → the in-memory gate above already passed, so
    // allow it rather than hard-fail the endpoint. Logged for visibility.
    log.warn("global rate limit fell back to in-memory", { key });
    return true;
  }
}
