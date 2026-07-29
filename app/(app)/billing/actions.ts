"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSubscription } from "@/lib/data/subscriptions";
import { createCheckoutUrl, createPortalUrl } from "@/lib/paddle/client";
import { paddleConfig } from "@/lib/env";

/**
 * Start checkout for a paid plan. The plan arrives as a bound server-action
 * argument rather than from the form body, so the server decides what is
 * billed — a client cannot ask to be charged for something cheaper than what
 * it receives.
 *
 * Falls back to a friendly error when billing isn't configured, which is the
 * normal state in any environment without Paddle keys.
 */
export async function startCheckout(plan: "pro" | "team") {
  const user = await requireUser();
  if (!paddleConfig()) redirect("/billing?error=unavailable");

  // Reuse the Paddle customer if this user has bought before; the row is only
  // written by the webhook, so its absence simply means "first purchase".
  const sub = await getSubscription();
  const url = await createCheckoutUrl({
    plan,
    userId: user.id,
    email: user.email,
    customerId: sub?.billing_customer_id ?? null,
  });
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}

/**
 * Open Paddle's hosted portal to update payment details or cancel. Paddle owns
 * that screen because Paddle is the merchant of record — the buyer's contract
 * for the purchase is with them, not with us.
 */
export async function openPortal() {
  await requireUser();
  const sub = await getSubscription();
  if (!sub?.billing_customer_id) redirect("/billing?error=nocustomer");

  const url = await createPortalUrl(sub.billing_customer_id);
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}
