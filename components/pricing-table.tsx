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
 *
 * Styled as one editorial ledger — hairline-separated columns, large Fraunces
 * prices, and a struck-diamond mark on the recommended plan — rather than the
 * generic three-floating-cards-with-a-"Most Popular"-ribbon pattern.
 */
export function PricingTable({ currentPlan }: { currentPlan?: string }) {
  return (
    <div className="overflow-hidden rounded-frame border border-line">
      <div className="grid divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = currentPlan === id;
          const featured = !!plan.highlighted;
          return (
            <div key={id} className={cn("flex flex-col p-8", featured && "bg-iris/[0.05]")}>
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-ivory">
                  {plan.name}
                </h3>
                {featured && (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
                    <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-iris" />
                    Recommended
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-ivory-dim">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-bold tracking-[-0.03em] text-ivory">
                  {formatPrice(plan)}
                </span>
                <span className="font-mono text-xs text-ash">/mo</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3 border-t border-line pt-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm text-ivory-dim">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isCurrent ? (
                  <div className="flex h-12 items-center justify-center rounded-pill border border-line text-sm text-ash">
                    Current plan
                  </div>
                ) : (
                  <Button
                    href={plan.id === "free" ? "/login" : `/login?plan=${plan.id}`}
                    variant={featured ? "primary" : "ghost"}
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
    </div>
  );
}
