import { createAdminClient } from "@/lib/supabase/admin";

/** Monthly check allowance per plan. */
export const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  pro: 2000,
};

/** Current month key, `YYYY-MM`, in UTC. */
export function monthKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function limitForPlan(plan: string): number {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Atomically consume one check from the installation's monthly allowance.
 * Returns true if the check may proceed (and records it), false if the limit
 * is reached. Delegates to the `consume_usage` Postgres function so the
 * read-modify-write is race-free.
 */
export async function consumeUsage(
  installId: string,
  plan: string,
): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("consume_usage", {
    p_install_id: installId,
    p_month: monthKey(),
    p_limit: limitForPlan(plan),
  });
  if (error) throw new Error(`consume_usage: ${error.message}`);
  return data === true;
}
