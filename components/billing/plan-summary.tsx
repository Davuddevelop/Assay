import Link from "next/link";

import { getPlan, nextPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * The signed-in workspace's plan + monthly usage, with an upgrade nudge.
 * Presentational — the dashboard passes real numbers from getUsageSummary().
 */
export function PlanSummary({
  planId,
  used,
  limit,
}: {
  planId: string;
  used: number;
  limit: number;
}) {
  const plan = getPlan(planId);
  const upsell = nextPlan(planId);
  const fraction = limit > 0 ? Math.min(1, used / limit) : 0;
  const near = fraction >= 0.8;

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-pill border border-iris/40 bg-iris/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
            {plan.name} plan
          </span>
          <span className="text-sm text-ivory-dim">
            {used.toLocaleString()} / {limit.toLocaleString()} checks this month
          </span>
        </div>
        {upsell && (
          <Link
            href="/pricing"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-iris-soft transition-colors hover:text-ivory"
          >
            Upgrade to {upsell.name} →
          </Link>
        )}
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-pill bg-onyx">
        <div
          className={cn(
            "h-full rounded-pill transition-[width]",
            near ? "bg-oxblood" : "bg-iris",
          )}
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>

      {near && upsell && (
        <p className="mt-3 text-xs text-oxblood-soft">
          You&rsquo;ve used {Math.round(fraction * 100)}% of this month&rsquo;s
          checks. Upgrade to {upsell.name} for {upsell.checksPerMonth.toLocaleString()} / month.
        </p>
      )}
    </div>
  );
}
