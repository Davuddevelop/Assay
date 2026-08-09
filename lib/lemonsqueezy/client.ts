import "server-only";

import { lemonSqueezyConfig } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

/**
 * Dependency-free Lemon Squeezy client — JSON:API calls to the REST API,
 * matching the codebase's no-SDK style. Only the two things billing needs:
 * open a checkout, and open the customer portal so someone can cancel without
 * emailing us.
 *
 * Unlike Paddle, Lemon Squeezy's checkout API returns a real hosted checkout
 * page (`data.attributes.url`) — there is no overlay-only checkout, so the
 * browser can be redirected straight to it. That's why there is no
 * client-side counterpart to the old `components/billing/paddle-checkout.tsx`.
 *
 * Every call returns null when Lemon Squeezy isn't configured, so the app
 * runs fine without billing.
 */

const API_BASE = "https://api.lemonsqueezy.com/v1";

interface LsResource<A> {
  id?: string;
  attributes?: A;
}

interface LsResponse<A> {
  data?: LsResource<A>;
  errors?: { code?: string; detail?: string }[];
}

async function lsFetch<A>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<LsResource<A> | null> {
  const cfg = lemonSqueezyConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: init.method,
      headers: {
        authorization: `Bearer ${cfg.apiKey}`,
        accept: "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const json = (await res.json()) as LsResponse<A>;
    if (!res.ok || (json.errors && json.errors.length > 0)) {
      // `detail` is Lemon Squeezy's own human-readable reason; never surfaced
      // to the buyer, only logged, since it can name internal store/variant ids.
      log.error("lemon squeezy api error", {
        path,
        status: res.status,
        code: json.errors?.[0]?.code ?? "unknown",
      });
      return null;
    }
    return json.data ?? null;
  } catch {
    log.error("lemon squeezy api call failed", { path });
    return null;
  }
}

interface CheckoutAttrs {
  url?: string | null;
}

/**
 * Start a checkout for a paid plan and return the hosted checkout URL.
 *
 * The user id rides in `checkout_data.custom` so the webhook can map the
 * resulting subscription back to an account. Lemon Squeezy copies custom data
 * onto every Order/Subscription webhook it fires for this checkout.
 *
 * There is no "reuse the existing customer" call here the way Paddle's client
 * has one — Lemon Squeezy matches or creates a customer by email on its own
 * side, so passing the email is enough.
 */
export async function createCheckoutUrl(args: {
  plan: Exclude<PlanId, "free">;
  userId: string;
  email?: string;
}): Promise<string | null> {
  const cfg = lemonSqueezyConfig();
  if (!cfg) return null;

  const variantId = cfg.variantIds[args.plan];
  if (!variantId) {
    log.error("lemon squeezy: no variant id for plan", { plan: args.plan });
    return null;
  }

  const body = {
    data: {
      type: "checkouts",
      attributes: {
        test_mode: cfg.testMode,
        checkout_data: {
          custom: { user_id: args.userId, plan: args.plan },
          ...(args.email ? { email: args.email } : {}),
        },
      },
      relationships: {
        store: { data: { type: "stores", id: cfg.storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const data = await lsFetch<CheckoutAttrs>("/checkouts", { method: "POST", body });
  const url = data?.attributes?.url ?? null;
  if (!url) {
    log.error("lemon squeezy: checkout created without a url", {
      hint: "check the store id and variant id are correct",
    });
  }
  return url;
}

interface SubscriptionAttrs {
  urls?: { customer_portal?: string | null };
}

/**
 * A link to Lemon Squeezy's hosted customer portal, where someone can update
 * their card or cancel. Lemon Squeezy owns this screen because Lemon Squeezy
 * is the merchant of record — the buyer's contract is with them, not with us.
 *
 * Portal URLs are pre-signed and expire 24 hours after they're issued, so
 * this is fetched fresh on every visit rather than stored — and it needs the
 * *subscription* id, not a customer id, because that's where Lemon Squeezy's
 * API puts it.
 */
export async function createPortalUrl(subscriptionId: string): Promise<string | null> {
  const data = await lsFetch<SubscriptionAttrs>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
  return data?.attributes?.urls?.customer_portal ?? null;
}
