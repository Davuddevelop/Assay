import { createAdminClient } from "@/lib/supabase/admin";
import { checksLimit } from "@/lib/plans";

/** Current month key, `YYYY-MM`, in UTC. */
function monthKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Atomically consume one scan from the user's monthly allowance. Returns true if
 * the scan may proceed (and records it), false if the limit is reached. Keyed by
 * user via the `consume_scan_usage` Postgres function so the read-modify-write
 * is race-free.
 */
export async function consumeScanUsage(
  userId: string,
  plan: string,
): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("consume_scan_usage", {
    p_user_id: userId,
    p_month: monthKey(),
    p_limit: checksLimit(plan),
  });
  if (error) throw new Error(`consume_scan_usage: ${error.message}`);
  return data === true;
}
