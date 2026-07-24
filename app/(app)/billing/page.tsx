import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getUserPlan, getSubscription } from "@/lib/data/subscriptions";
import { scanUsageThisMonth } from "@/lib/usage";
import { getPlan, PLANS, PLAN_ORDER, formatPrice, checksLimit } from "@/lib/plans";
import { stripeConfig } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { startCheckout, openPortal } from "@/app/(app)/billing/actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Billing — Assay",
  description: "Manage your Assay plan, usage, and subscription.",
  robots: { index: false, follow: true },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const user = await requireUser();
  const [planId, sub, used] = await Promise.all([
    getUserPlan(user.id),
    getSubscription(),
    scanUsageThisMonth(user.id),
  ]);
  const plan = getPlan(planId);
  const limit = checksLimit(planId);
  const billingOn = stripeConfig() !== null;

  const notice =
    success === "1"
      ? { tone: "ok" as const, text: "You're upgraded. Welcome to Pro." }
      : error === "unavailable"
        ? { tone: "warn" as const, text: "Billing isn't available right now. Try again shortly." }
        : error === "nocustomer"
          ? { tone: "warn" as const, text: "No billing account yet — pick a plan below to start." }
          : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
        Billing
      </h1>

      {notice && (
        <div
          className={cn(
            "mt-6 rounded-[var(--radius-card)] border px-4 py-3 text-sm",
            notice.tone === "ok"
              ? "border-iris/40 bg-iris/10 text-iris-soft"
              : "border-oxblood/40 bg-oxblood/10 text-oxblood-soft",
          )}
        >
          {notice.text}
        </div>
      )}

      {/* current plan + usage */}
      <div className="panel mt-8 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
            Current plan
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-ivory">{plan.name}</p>
          <p className="mt-1 text-sm text-ivory-dim">
            {used} / {limit.toLocaleString()} scans this month
          </p>
        </div>
        {sub?.stripe_customer_id && planId !== "free" && (
          <form action={openPortal}>
            <Button type="submit" variant="ghost" size="md">
              Manage subscription
            </Button>
          </form>
        )}
      </div>

      {!billingOn && (
        <p className="mt-4 text-sm text-ash">
          Payments aren&rsquo;t configured in this environment yet — upgrades are
          disabled.
        </p>
      )}

      {/* plan ladder */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const isCurrent = id === planId;
          const canUpgrade = billingOn && id !== "free" && id !== planId;
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col rounded-[var(--radius-card)] border p-6",
                p.highlighted ? "border-iris/40 bg-iris/[0.05]" : "border-line",
              )}
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-ivory">
                {p.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-ivory">
                  {formatPrice(p)}
                </span>
                <span className="font-mono text-xs text-ash">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-ivory-dim">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <div className="flex h-11 items-center justify-center rounded-pill border border-line text-sm text-ash">
                    Current
                  </div>
                ) : canUpgrade ? (
                  <form action={startCheckout.bind(null, id as "pro" | "team")}>
                    <Button
                      type="submit"
                      variant={p.highlighted ? "primary" : "ghost"}
                      size="md"
                      className="w-full"
                    >
                      {p.cta}
                    </Button>
                  </form>
                ) : (
                  <div className="h-11" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
