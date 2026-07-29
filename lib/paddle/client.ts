import "server-only";

import { paddleConfig } from "@/lib/env";
import type { PlanId } from "@/lib/plans";
import { log } from "@/lib/log";

/**
 * Dependency-free Paddle client — JSON calls to the Billing API, matching the
 * codebase's no-SDK style. Only the two things billing needs: open a checkout,
 * and open the customer portal so someone can cancel without emailing us.
 *
 * The transaction is created server-side so the price being charged is decided
 * here and reaches the browser only as an opaque id. Paddle Billing has no
 * hosted checkout page, though: with a default payment link configured, the
 * `checkout.url` it returns is our own /billing URL carrying `?_ptxn=<id>`,
 * and the payment UI is an overlay that only Paddle.js can draw. That is what
 * components/billing/paddle-checkout.tsx is for — without it the redirect
 * lands on a page where nothing happens.
 *
 * Every call returns null when Paddle isn't configured, so the app runs fine
 * without billing.
 */

interface PaddleResponse<T> {
  data?: T;
  error?: { code?: string; detail?: string };
}

async function paddleFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<T | null> {
  const cfg = paddleConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.apiBase}${path}`, {
      method: init.method,
      headers: {
        authorization: `Bearer ${cfg.apiKey}`,
        "content-type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const json = (await res.json()) as PaddleResponse<T>;
    if (!res.ok || json.error) {
      // `detail` is Paddle's own human-readable reason; never surfaced to the
      // buyer, only logged, since it can name internal price/product ids.
      log.error("paddle api error", {
        path,
        status: res.status,
        code: json.error?.code ?? "unknown",
      });
      return null;
    }
    return json.data ?? null;
  } catch {
    log.error("paddle api call failed", { path });
    return null;
  }
}

/**
 * Start a checkout for a paid plan and return the URL to send the buyer to.
 *
 * The user id rides in `custom_data` so the webhook can map the resulting
 * subscription back to an account. Paddle copies it from the transaction onto
 * the subscription, which is what makes the mapping survive renewals.
 *
 * Returns null if Paddle has no default payment link configured — that setting
 * is what produces `checkout.url`, and it is easy to miss during setup.
 */
export async function createCheckoutUrl(args: {
  plan: Exclude<PlanId, "free">;
  userId: string;
  email?: string;
  customerId?: string | null;
}): Promise<string | null> {
  const cfg = paddleConfig();
  if (!cfg) return null;

  const price = cfg.priceIds[args.plan];
  if (!price) {
    log.error("paddle: no price id for plan", { plan: args.plan });
    return null;
  }

  const body: Record<string, unknown> = {
    items: [{ price_id: price, quantity: 1 }],
    custom_data: { user_id: args.userId, plan: args.plan },
    collection_mode: "automatic",
  };
  // Reuse the existing customer when we know it, so a returning buyer isn't
  // duplicated in Paddle and their history stays on one record.
  if (args.customerId) body.customer_id = args.customerId;
  else if (args.email) body.customer = { email: args.email };

  const data = await paddleFetch<{ checkout?: { url?: string | null } }>(
    "/transactions",
    { method: "POST", body },
  );
  const url = data?.checkout?.url ?? null;
  if (!url) {
    log.error("paddle: transaction created without a checkout url", {
      hint: "set a default payment link in Paddle > Checkout settings",
    });
  }
  return url;
}

/**
 * A link to Paddle's hosted customer portal, where someone can update their
 * card or cancel. Paddle owns this screen because Paddle is the merchant of
 * record — the buyer's contract is with them, not with us.
 */
export async function createPortalUrl(customerId: string): Promise<string | null> {
  const data = await paddleFetch<{ urls?: { general?: { overview?: string } } }>(
    `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
    { method: "POST", body: {} },
  );
  return data?.urls?.general?.overview ?? null;
}
