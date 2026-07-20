"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSubscription, upsertSubscription } from "@/lib/data/subscriptions";
import {
  ensureStripeCustomer,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/stripe/client";
import { stripeConfig, siteUrl } from "@/lib/env";

/**
 * Start Stripe Checkout for a paid plan. Ensures a Stripe customer exists for
 * the user (persisting its id so the webhook can find them), then redirects to
 * the hosted Checkout page. Falls back to a friendly error when billing isn't
 * configured.
 */
export async function startCheckout(plan: "pro" | "team") {
  const user = await requireUser();
  if (!stripeConfig()) redirect("/billing?error=unavailable");

  const sub = await getSubscription();
  const customerId = await ensureStripeCustomer(
    sub?.stripe_customer_id ?? null,
    user.email,
    user.id,
  );
  if (!customerId) redirect("/billing?error=unavailable");

  if (!sub?.stripe_customer_id) {
    await upsertSubscription({ user_id: user.id, stripe_customer_id: customerId });
  }

  const url = await createCheckoutSession({
    plan,
    customerId,
    userId: user.id,
    successUrl: `${siteUrl()}/billing?success=1`,
    cancelUrl: `${siteUrl()}/billing?canceled=1`,
  });
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}

/** Open the Stripe customer portal to manage or cancel the subscription. */
export async function openPortal() {
  await requireUser();
  const sub = await getSubscription();
  if (!sub?.stripe_customer_id) redirect("/billing?error=nocustomer");

  const url = await createPortalSession({
    customerId: sub.stripe_customer_id,
    returnUrl: `${siteUrl()}/billing`,
  });
  if (!url) redirect("/billing?error=unavailable");
  redirect(url);
}
