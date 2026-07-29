import { NextResponse, type NextRequest } from "next/server";

import { paddleConfig } from "@/lib/env";
import { verifyPaddleSignature } from "@/lib/paddle/signature";
import { upsertSubscription, getSubscriptionByCustomer } from "@/lib/data/subscriptions";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paddle webhook — the single source of truth for a user's plan.
 *
 * Nothing here is trusted until the signature verifies against the raw body:
 * this endpoint is public, and a forged POST would otherwise be a free Pro
 * account. Returns 200 fast; a bad signature is 400. Idempotent (upsert by
 * user), so Paddle's retries are safe.
 */
export async function POST(req: NextRequest) {
  const cfg = paddleConfig();
  if (!cfg) return NextResponse.json({ error: "billing disabled" }, { status: 503 });

  const payload = await req.text();
  const sig = req.headers.get("paddle-signature");
  if (!verifyPaddleSignature(payload, sig, cfg.webhookSecret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(payload) as PaddleEvent;
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  try {
    await handleEvent(event, cfg.priceIds);
  } catch {
    // Log and 500 so Paddle retries — never swallow a sync failure silently.
    log.error("paddle webhook handler failed", { type: event.event_type });
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

interface PaddleEvent {
  event_type: string;
  data: Record<string, unknown>;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** The plan a subscription's line items resolve to, by price id. */
function priceToPlan(
  data: Record<string, unknown>,
  priceIds: { pro: string; team: string },
): PlanId | null {
  const items = Array.isArray(data.items) ? data.items : [];
  for (const item of items) {
    const price = (item as { price?: { id?: unknown } }).price;
    const id = str(price?.id);
    if (id && id === priceIds.team) return "team";
    if (id && id === priceIds.pro) return "pro";
  }
  return null;
}

/** The user this event belongs to: custom_data first, then the customer id. */
async function resolveUserId(data: Record<string, unknown>): Promise<string | null> {
  const custom = data.custom_data as { user_id?: unknown } | null | undefined;
  const fromCustom = str(custom?.user_id);
  if (fromCustom) return fromCustom;

  const customerId = str(data.customer_id);
  if (!customerId) return null;
  const existing = await getSubscriptionByCustomer(customerId);
  return existing?.user_id ?? null;
}

function customPlan(data: Record<string, unknown>): PlanId | null {
  const custom = data.custom_data as { plan?: unknown } | null | undefined;
  const plan = str(custom?.plan);
  return plan === "pro" || plan === "team" ? plan : null;
}

async function handleEvent(
  event: PaddleEvent,
  priceIds: { pro: string; team: string },
): Promise<void> {
  const data = event.data;

  switch (event.event_type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.activated":
    case "subscription.resumed": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      // Price id is authoritative — it's what Paddle actually billed. The
      // custom_data plan is only a fallback for a price we don't recognise.
      const plan = priceToPlan(data, priceIds) ?? customPlan(data) ?? "pro";
      const period = data.current_billing_period as { ends_at?: unknown } | undefined;
      await upsertSubscription({
        user_id: userId,
        plan,
        status: str(data.status) ?? "active",
        billing_customer_id: str(data.customer_id),
        billing_subscription_id: str(data.id),
        current_period_end: str(period?.ends_at),
      });
      return;
    }

    case "subscription.canceled":
    case "subscription.paused": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      // Drop to Free rather than deleting the row: the Paddle ids stay useful
      // for support, and an upsert is idempotent under retries.
      await upsertSubscription({
        user_id: userId,
        plan: "free",
        status: "canceled",
        billing_customer_id: str(data.customer_id),
        billing_subscription_id: str(data.id),
      });
      return;
    }

    default:
      return;
  }
}
