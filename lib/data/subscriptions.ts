import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanId } from "@/lib/plans";
import type { SubscriptionRow } from "@/lib/db/types";

/**
 * A subscription is only "live" when Stripe says it's active (or on the grace
 * window we treat as active). Past-due / canceled falls back to Free so a lapsed
 * payment quietly drops entitlements instead of granting paid features forever.
 */
function isLive(status: string): boolean {
  return status === "active" || status === "trialing";
}

function normalizePlan(plan: string): PlanId {
  return plan === "pro" || plan === "team" ? plan : "free";
}

/**
 * The user's effective plan id — the one gating decisions must use. Reads the
 * subscription (RLS-scoped) and returns "free" for no row or a non-live status.
 * Never throws; defaults to "free" so a lookup failure can't hand out paid
 * features.
 */
export async function getUserPlan(userId: string): Promise<PlanId> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data || !isLive(data.status)) return "free";
    return normalizePlan(data.plan);
  } catch {
    return "free";
  }
}

/** The signed-in user's subscription row (RLS), or null. For the billing page. */
export async function getSubscription(): Promise<SubscriptionRow | null> {
  const db = await createClient();
  const { data } = await db.from("subscriptions").select("*").maybeSingle();
  return data ?? null;
}

/** Look up a subscription by Stripe customer id — used by the webhook. */
export async function getSubscriptionByCustomer(
  customerId: string,
): Promise<SubscriptionRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data ?? null;
}

/** Upsert subscription state (service role) — the Stripe webhook's write path. */
export async function upsertSubscription(
  row: Partial<SubscriptionRow> & { user_id: string },
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("subscriptions")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(`upsert subscription: ${error.message}`);
}
