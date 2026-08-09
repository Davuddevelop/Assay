"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSubscription } from "@/lib/data/subscriptions";
import { createCheckoutUrl, createPortalUrl } from "@/lib/lemonsqueezy/client";
import { lemonSqueezyConfig } from "@/lib/env";

/**
 * Start checkout for a paid plan. The plan arrives as a bound server-action
 * argument rather than from the form body, so the server decides what is
 * billed — a client cannot ask to be charged for something cheaper than what
 * it receives.
 *
 * Falls back to a friendly error when billing isn't configured, which is the
 * normal state in any environment without Lemon Squeezy keys.
 */
export async function startCheckout(plan: "pro" | "team") {
  const user = await requireUser();
  if (!lemonSqueezyConfig()) redirect("/billing?error=unavailable");

  const url = await createCheckoutUrl({
    plan,
    userId: user.id,
    email: user.email,
  });
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}

/**
 * Open Lemon Squeezy's hosted portal to update payment details or cancel.
 * Lemon Squeezy owns that screen because Lemon Squeezy is the merchant of
 * record — the buyer's contract for the purchase is with them, not with us.
 */
export async function openPortal() {
  await requireUser();
  const sub = await getSubscription();
  if (!sub?.billing_subscription_id) redirect("/billing?error=nocustomer");

  const url = await createPortalUrl(sub.billing_subscription_id);
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}
