import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-iris-soft" fill="none" aria-hidden>
      <path d="M5 10.5 8.5 14 15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The pricing ladder, shared between the marketing /pricing page and any
 * upgrade surface. Reads the plan catalog (lib/plans.ts) so it never drifts.
 */
export function PricingTable({ currentPlan }: { currentPlan?: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const isCurrent = currentPlan === id;
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col rounded-[var(--radius-card)] border bg-surface/50 p-7",
              plan.highlighted
                ? "border-iris/50 shadow-[0_30px_80px_-40px_rgba(139,139,240,0.5)]"
                : "border-line",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-7 rounded-pill bg-iris px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-onyx">
                Most popular
              </span>
            )}

            <h3 className="text-lg font-semibold text-ivory">{plan.name}</h3>
            <p className="mt-1 text-sm text-ivory-dim">{plan.tagline}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold tracking-[-0.02em] text-ivory">
                {formatPrice(plan)}
              </span>
              <span className="text-sm text-ash">/ month</span>
            </div>

            <ul className="mt-7 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-ivory-dim">
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {isCurrent ? (
                <div className="flex h-12 items-center justify-center rounded-pill border border-border text-sm text-ash">
                  Current plan
                </div>
              ) : (
                <Button
                  href={plan.id === "free" ? "/login" : `/login?plan=${plan.id}`}
                  variant={plan.highlighted ? "primary" : "ghost"}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
