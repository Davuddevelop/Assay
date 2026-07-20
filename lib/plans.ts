/**
 * Canonical plan catalog — the single source of truth for pricing, limits, and
 * the features shown across the app. The pricing page, usage enforcement, and
 * dashboard all read from here so numbers never drift.
 */
export type PlanId = "free" | "pro" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  /** USD per month. */
  priceMonthly: number;
  tagline: string;
  /** Monthly check allowance, enforced before a check runs. */
  checksPerMonth: number;
  /** Connected-repo cap; null = unlimited. */
  repoLimit: number | null;
  /** How many apps can be watched (continuous re-checking); null = unlimited. */
  watchLimit: number | null;
  /** Whether this plan gets email alerts (regression + weekly digest). */
  emailAlerts: boolean;
  seats: number;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "For checking your first app.",
    checksPerMonth: 100,
    repoLimit: 1,
    watchLimit: 1,
    emailAlerts: false,
    seats: 1,
    cta: "Start free",
    features: [
      "1 app",
      "100 scans / month",
      "Plain-language report + paste-back fixes",
      "Watch 1 app — regressions on your dashboard",
      "Saved scan history",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    tagline: "For builders shipping every week.",
    checksPerMonth: 2000,
    repoLimit: null,
    watchLimit: null,
    emailAlerts: true,
    seats: 1,
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      "Unlimited apps",
      "2,000 scans / month",
      "Continuous re-scans on every change",
      "Email alerts when a change breaks something",
      "Weekly watch digest",
      "Priority scan queue",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 99,
    tagline: "For teams that ship together.",
    checksPerMonth: 10000,
    repoLimit: null,
    watchLimit: null,
    emailAlerts: true,
    seats: 10,
    cta: "Start Team",
    features: [
      "Everything in Pro",
      "10,000 scans / month",
      "Up to 10 seats",
      "Shared apps across the team",
      "Audit log",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "team"];

function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro" || value === "team";
}

/** Resolve a plan by id, defaulting to Free for unknown values. */
export function getPlan(planId: string): Plan {
  return isPlanId(planId) ? PLANS[planId] : PLANS.free;
}

/** Monthly check allowance for a plan id. */
export function checksLimit(planId: string): number {
  return getPlan(planId).checksPerMonth;
}

/** How many apps this plan may watch; null = unlimited. */
export function watchLimit(planId: string): number | null {
  return getPlan(planId).watchLimit;
}

/** Whether this plan receives email alerts (regression + weekly digest). */
export function hasEmailAlerts(planId: string): boolean {
  return getPlan(planId).emailAlerts;
}

/** The next paid plan to upsell from the current one, or null if top tier. */
export function nextPlan(planId: string): Plan | null {
  const idx = PLAN_ORDER.indexOf(getPlan(planId).id);
  const next = PLAN_ORDER[idx + 1];
  return next ? PLANS[next] : null;
}

export function formatPrice(plan: Plan): string {
  return plan.priceMonthly === 0 ? "$0" : `$${plan.priceMonthly}`;
}
