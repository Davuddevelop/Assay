import { NextResponse, type NextRequest } from "next/server";

import { lemonSqueezyConfig, lemonSqueezyTestEventOnProduction } from "@/lib/env";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy/signature";
import { upsertSubscription, getSubscriptionByCustomer } from "@/lib/data/subscriptions";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lemon Squeezy webhook — the single source of truth for a user's plan.
 *
 * Nothing here is trusted until the signature verifies against the raw body:
 * this endpoint is public, and a forged POST would otherwise be a free Pro
 * account. Returns 200 fast; a bad signature is 400. Idempotent (upsert by
 * user), so Lemon Squeezy's retries are safe.
 */
export async function POST(req: NextRequest) {
  const cfg = lemonSqueezyConfig();
  if (!cfg) return NextResponse.json({ error: "billing disabled" }, { status: 503 });

  const payload = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifyLemonSqueezySignature(payload, sig, cfg.webhookSecret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: LsEvent;
  try {
    event = JSON.parse(payload) as LsEvent;
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "";

  // The store's own "Test mode" toggle, not anything this app set — a
  // genuinely-signed test event must still never grant a real plan in prod.
  if (lemonSqueezyTestEventOnProduction(process.env.VERCEL_ENV, event.meta?.test_mode === true)) {
    log.warn("lemon squeezy test-mode webhook rejected in production", { type: eventName });
    return NextResponse.json({ error: "test mode" }, { status: 400 });
  }

  try {
    await handleEvent(event, cfg.variantIds);
  } catch {
    // Log and 500 so Lemon Squeezy retries — never swallow a sync failure silently.
    log.error("lemon squeezy webhook handler failed", { type: eventName });
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

interface LsEvent {
  meta?: {
    event_name?: string;
    test_mode?: boolean;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/** The plan a subscription's variant resolves to, by variant id. */
function variantToPlan(
  attrs: Record<string, unknown> | undefined,
  variantIds: { pro: string; team: string },
): PlanId | null {
  const id = str(attrs?.variant_id);
  if (id && id === variantIds.team) return "team";
  if (id && id === variantIds.pro) return "pro";
  return null;
}

/** The user this event belongs to: custom_data first, then the customer id. */
async function resolveUserId(
  custom: Record<string, unknown> | undefined,
  customerId: string | null,
): Promise<string | null> {
  const fromCustom = str(custom?.user_id);
  if (fromCustom) return fromCustom;

  if (!customerId) return null;
  const existing = await getSubscriptionByCustomer(customerId);
  return existing?.user_id ?? null;
}

function customPlan(custom: Record<string, unknown> | undefined): PlanId | null {
  const plan = str(custom?.plan);
  return plan === "pro" || plan === "team" ? plan : null;
}

async function handleEvent(
  event: LsEvent,
  variantIds: { pro: string; team: string },
): Promise<void> {
  const attrs = event.data?.attributes;
  const custom = event.meta?.custom_data;
  const customerId = str(attrs?.customer_id);

  switch (event.meta?.event_name) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused": {
      const userId = await resolveUserId(custom, customerId);
      if (!userId) return;
      // Variant id is authoritative — it's what Lemon Squeezy actually billed.
      // The custom_data plan is only a fallback for a variant we don't recognise.
      const plan = variantToPlan(attrs, variantIds) ?? customPlan(custom) ?? "pro";
      await upsertSubscription({
        user_id: userId,
        plan,
        status: str(attrs?.status) ?? "active",
        billing_customer_id: customerId,
        billing_subscription_id: str(event.data?.id),
        current_period_end: str(attrs?.renews_at),
      });
      return;
    }

    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused": {
      const userId = await resolveUserId(custom, customerId);
      if (!userId) return;
      // Drop to Free rather than deleting the row: the Lemon Squeezy ids stay
      // useful for support, and an upsert is idempotent under retries.
      await upsertSubscription({
        user_id: userId,
        plan: "free",
        status: "canceled",
        billing_customer_id: customerId,
        billing_subscription_id: str(event.data?.id),
      });
      return;
    }

    default:
      return;
  }
}
