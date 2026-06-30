import { createAdminClient } from "@/lib/supabase/admin";
import { checksLimit } from "@/lib/plans";

/** Current month key, `YYYY-MM`, in UTC. */
export function monthKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Monthly check allowance for a plan — sourced from the plan catalog. */
export function limitForPlan(plan: string): number {
  return checksLimit(plan);
}

export interface UsageSummary {
  used: number;
  limit: number;
  remaining: number;
  /** 0–1 fraction of the allowance consumed. */
  fraction: number;
}

/** This month's usage for an installation against its plan limit. */
export async function getUsageSummary(
  installId: string,
  plan: string,
): Promise<UsageSummary> {
  const db = createAdminClient();
  const { data } = await db
    .from("usage")
    .select("count")
    .eq("install_id", installId)
    .eq("month", monthKey())
    .maybeSingle();

  const used = data?.count ?? 0;
  const limit = limitForPlan(plan);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    fraction: limit > 0 ? Math.min(1, used / limit) : 0,
  };
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

/** This month's scan usage for a user against their plan limit. */
export async function getScanUsageSummary(
  userId: string,
  plan: string,
): Promise<UsageSummary> {
  const db = createAdminClient();
  const { data } = await db
    .from("scan_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("month", monthKey())
    .maybeSingle();

  const used = data?.count ?? 0;
  const limit = limitForPlan(plan);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    fraction: limit > 0 ? Math.min(1, used / limit) : 0,
  };
}

/**
 * Atomically consume one scan from the user's monthly allowance. Returns true if
 * the scan may proceed (and records it), false if the limit is reached. Keyed by
 * user (scans have no installation) via the `consume_scan_usage` Postgres
 * function so the read-modify-write is race-free.
 */
export async function consumeScanUsage(
  userId: string,
  plan: string,
): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("consume_scan_usage", {
    p_user_id: userId,
    p_month: monthKey(),
    p_limit: limitForPlan(plan),
  });
  if (error) throw new Error(`consume_scan_usage: ${error.message}`);
  return data === true;
}
