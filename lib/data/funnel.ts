import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

/**
 * The steps between "ran a scan" and "has an account" — the stretch that was
 * completely dark.
 *
 * Deliberately three counters and nothing else. The question worth answering is
 * which of two walls people stop at, and that needs counts, not a session
 * graph. Anything richer would mean identifying visitors, which this product
 * cannot credibly do while telling people it stores almost nothing about them.
 */
export type FunnelEvent = "cta_click" | "signup" | "signup_from_scan";

/**
 * Fire-and-forget: a counter must never fail a sign-in or make anyone wait.
 */
export function recordFunnelEvent(event: FunnelEvent): void {
  try {
    const db = createAdminClient();
    void db
      .from("funnel_events")
      .insert({ event })
      .then(({ error }) => {
        if (error) log.warn("funnel event write failed", { event, reason: error.message });
      });
  } catch (err) {
    log.warn("funnel event write failed", {
      event,
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}
