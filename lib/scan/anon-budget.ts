/**
 * A spend ceiling for anonymous scanning.
 *
 * `/try` runs a real scan — outbound fetches plus a Claude call — for anyone,
 * with no account. Per-IP limits bound what one visitor can do and nothing
 * bounds what everyone can do together, so a script rotating addresses bills
 * this account until someone notices. That is the only part of the system that
 * can cost real money while nobody is watching.
 *
 * This is a circuit breaker, not a quota. It should sit high enough that a good
 * traffic day never reaches it and low enough that abuse stops well before it
 * hurts. Signed-in scanning is metered separately by plan and is unaffected —
 * when the free surface trips, the way through is to sign in.
 *
 * Pure, so the arithmetic is testable without a request.
 */

/** Roughly a very good day of free traffic. Raise it when real usage nears it. */
export const DEFAULT_ANON_DAILY = 250;

/** Never let a burst drain a whole day in minutes, however the daily is set. */
const MIN_HOURLY = 20;

export interface AnonBudget {
  hourly: number;
  daily: number;
}

/**
 * Resolve the ceiling from `ANON_SCAN_BUDGET_DAILY`. Anything missing or
 * nonsensical falls back to the default rather than disabling the guard —
 * a typo in an env var must never open the tap.
 */
export function anonBudget(raw: string | undefined): AnonBudget {
  const parsed = Number(raw);
  const daily =
    Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_ANON_DAILY;
  return { daily, hourly: Math.max(MIN_HOURLY, Math.ceil(daily / 4)) };
}
