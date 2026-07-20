import { NextResponse, type NextRequest } from "next/server";

import { stripeConfig } from "@/lib/env";
import { verifyStripeSignature } from "@/lib/stripe/signature";
import {
  upsertSubscription,
  getSubscriptionByCustomer,
} from "@/lib/data/subscriptions";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the single source of truth for a user's plan. Signature is
 * verified against the raw body before anything is trusted; only then do we
 * sync subscription state. Returns 200 fast; a bad signature is 400. Idempotent
 * (upsert by user), so Stripe's retries are safe.
 */
export async function POST(req: NextRequest) {
  const cfg = stripeConfig();
  if (!cfg) return NextResponse.json({ error: "billing disabled" }, { status: 503 });

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!verifyStripeSignature(payload, sig, cfg.webhookSecret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  try {
    await handleEvent(event, cfg.priceIds);
  } catch {
    // Log and 500 so Stripe retries — never swallow a sync failure silently.
    log.error("stripe webhook handler failed", { type: event.type });
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

function priceToPlan(
  priceId: string | undefined,
  priceIds: { pro: string; team: string },
): PlanId | null {
  if (priceId && priceId === priceIds.team) return "team";
  if (priceId && priceId === priceIds.pro) return "pro";
  return null;
}

async function handleEvent(
  event: StripeEvent,
  priceIds: { pro: string; team: string },
): Promise<void> {
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = str(obj.client_reference_id) ?? metaUserId(obj);
      const customer = str(obj.customer);
      const subscription = str(obj.subscription);
      const plan = (metaPlan(obj) as PlanId | null) ?? "pro";
      if (!userId) return;
      await upsertSubscription({
        user_id: userId,
        plan,
        status: "active",
        stripe_customer_id: customer,
        stripe_subscription_id: subscription,
      });
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const userId = await resolveUserId(obj);
      if (!userId) return;
      const plan =
        (metaPlan(obj) as PlanId | null) ??
        priceToPlan(firstPriceId(obj), priceIds) ??
        "pro";
      await upsertSubscription({
        user_id: userId,
        plan,
        status: str(obj.status) ?? "active",
        stripe_customer_id: str(obj.customer),
        stripe_subscription_id: str(obj.id),
        current_period_end: periodEnd(obj),
      });
      return;
    }

    case "customer.subscription.deleted": {
      const userId = await resolveUserId(obj);
      if (!userId) return;
      await upsertSubscription({
        user_id: userId,
        plan: "free",
        status: "canceled",
        stripe_customer_id: str(obj.customer),
        stripe_subscription_id: str(obj.id),
      });
      return;
    }

    default:
      return; // ignore everything else
  }
}

// ── field extraction (Stripe objects are loosely typed) ──────────────────────

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function metaUserId(obj: Record<string, unknown>): string | null {
  const meta = obj.metadata as Record<string, unknown> | undefined;
  return meta ? str(meta.user_id) : null;
}

function metaPlan(obj: Record<string, unknown>): string | null {
  const meta = obj.metadata as Record<string, unknown> | undefined;
  return meta ? str(meta.plan) : null;
}

/** Resolve our user id from subscription metadata, else by Stripe customer id. */
async function resolveUserId(obj: Record<string, unknown>): Promise<string | null> {
  const fromMeta = metaUserId(obj);
  if (fromMeta) return fromMeta;
  const customer = str(obj.customer);
  if (!customer) return null;
  const existing = await getSubscriptionByCustomer(customer);
  return existing?.user_id ?? null;
}

function firstPriceId(obj: Record<string, unknown>): string | undefined {
  const items = obj.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  return items?.data?.[0]?.price?.id;
}

function periodEnd(obj: Record<string, unknown>): string | null {
  const end = obj.current_period_end;
  return typeof end === "number" ? new Date(end * 1000).toISOString() : null;
}
