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
  /**
   * Whether a regression on a watched app emails the owner.
   *
   * Free plans get this. It was paid, which quietly broke the only loop that
   * brings a non-coder back: a scan is a fact about the past, and nobody
   * revisits a dashboard to check on an app they think is fine. Without the
   * email, watching does nothing they will ever see. It also costs almost
   * nothing — monitoring is change-detected, so this fires only when someone
   * ships an edit that actually reopens something, and the monthly scan
   * allowance caps it. Being emailed the day your app breaks is also the best
   * moment this product will ever have to earn a subscription.
   */
  regressionAlerts: boolean;
  /** The weekly summary of everything watched — the paid habit. */
  weeklyDigest: boolean;
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
    tagline: "One app, watched for good.",
    checksPerMonth: 100,
    repoLimit: 1,
    watchLimit: 1,
    regressionAlerts: true,
    weeklyDigest: false,
    seats: 1,
    cta: "Start free",
    features: [
      "1 app, re-checked whenever you ship",
      "Email the moment a change breaks something",
      "100 scans / month",
      "Plain-language report + paste-back fixes",
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
    regressionAlerts: true,
    weeklyDigest: true,
    seats: 1,
    cta: "Upgrade to Pro",
    highlighted: true,
    features: [
      "Unlimited apps, all watched",
      "2,000 scans / month",
      "Weekly digest across everything you've shipped",
      "Priority scan queue",
      "Full scan history per app",
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
    regressionAlerts: true,
    weeklyDigest: true,
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

/** Whether a regression on a watched app emails the owner. Every plan does. */
export function hasRegressionAlerts(planId: string): boolean {
  return getPlan(planId).regressionAlerts;
}

/** Whether this plan receives the weekly summary of everything watched. */
export function hasWeeklyDigest(planId: string): boolean {
  return getPlan(planId).weeklyDigest;
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
