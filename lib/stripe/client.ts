import "server-only";

import { stripeConfig } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

/**
 * Dependency-free Stripe client — form-encoded calls to the REST API, matching
 * the codebase's no-SDK style. Only the few endpoints billing needs: create a
 * customer, open Checkout, open the customer portal. Every call no-ops (returns
 * null) when Stripe isn't configured, so the app runs fine without billing.
 */

const API = "https://api.stripe.com/v1";

function form(params: Record<string, string | undefined>): string {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) body.append(k, v);
  return body.toString();
}

async function stripePost<T>(
  path: string,
  secretKey: string,
  params: Record<string, string | undefined>,
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form(params),
    });
    if (!res.ok) {
      log.error("stripe api error", { path, status: res.status });
      return null;
    }
    return (await res.json()) as T;
  } catch {
    log.error("stripe api call failed", { path });
    return null;
  }
}

/** Reuse an existing customer or create one for this user. Returns its id. */
export async function ensureStripeCustomer(
  existingId: string | null,
  email: string | undefined,
  userId: string,
): Promise<string | null> {
  const cfg = stripeConfig();
  if (!cfg) return null;
  if (existingId) return existingId;
  const customer = await stripePost<{ id: string }>("/customers", cfg.secretKey, {
    email,
    "metadata[user_id]": userId,
  });
  return customer?.id ?? null;
}

/**
 * Create a Checkout Session for a paid plan and return the URL to redirect to.
 * The user id rides in metadata + client_reference_id so the webhook can map
 * the resulting subscription back to our user.
 */
export async function createCheckoutSession(args: {
  plan: Exclude<PlanId, "free">;
  customerId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  const cfg = stripeConfig();
  if (!cfg) return null;
  const price = cfg.priceIds[args.plan];
  if (!price) {
    log.error("stripe: no price id for plan", { plan: args.plan });
    return null;
  }
  const session = await stripePost<{ url: string }>("/checkout/sessions", cfg.secretKey, {
    mode: "subscription",
    customer: args.customerId,
    client_reference_id: args.userId,
    "metadata[user_id]": args.userId,
    "metadata[plan]": args.plan,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "subscription_data[metadata][user_id]": args.userId,
    "subscription_data[metadata][plan]": args.plan,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    allow_promotion_codes: "true",
  });
  return session?.url ?? null;
}

/** Open the Stripe customer portal (manage/cancel). Returns the URL. */
export async function createPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const cfg = stripeConfig();
  if (!cfg) return null;
  const session = await stripePost<{ url: string }>("/billing_portal/sessions", cfg.secretKey, {
    customer: args.customerId,
    return_url: args.returnUrl,
  });
  return session?.url ?? null;
}
