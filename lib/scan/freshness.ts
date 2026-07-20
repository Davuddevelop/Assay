/**
 * Verification freshness — a "Certified" result is a snapshot in time, not a
 * permanent diploma. An app the owner keeps editing drifts; a month-old pass
 * says little about what's live now. So certification visibly *ages*: fresh for
 * a while, then aging, then expired — which is exactly the nudge that turns a
 * one-time clean scan into a reason to come back (or, better, to switch on
 * watching so it auto-renews on every re-check).
 *
 * Pure and deterministic so it's unit-testable and safe on the server or client.
 */
type FreshnessState = "fresh" | "aging" | "expired" | "unknown";

/** A certification is considered current for this many days after the scan. */
export const VALID_DAYS = 30;
/** Within this many days of expiry we surface an "aging" nudge. */
const AGING_WINDOW_DAYS = 9;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Freshness {
  state: FreshnessState;
  /** Whole days since the scan completed (null when unknown). */
  ageDays: number | null;
  /** Whole days until expiry; negative once expired (null when unknown). */
  daysLeft: number | null;
  /** Short human label, e.g. "Verified today", "Expires in 3 days". */
  label: string;
}

export function verificationFreshness(
  completedAt: string | null,
  now: number = Date.now(),
): Freshness {
  if (!completedAt) {
    return { state: "unknown", ageDays: null, daysLeft: null, label: "Not yet verified" };
  }
  const completed = new Date(completedAt).getTime();
  if (Number.isNaN(completed)) {
    return { state: "unknown", ageDays: null, daysLeft: null, label: "Not yet verified" };
  }

  const ageDays = Math.max(0, Math.floor((now - completed) / DAY_MS));
  const daysLeft = VALID_DAYS - ageDays;

  if (daysLeft <= 0) {
    return { state: "expired", ageDays, daysLeft, label: "Verification expired" };
  }

  const state: FreshnessState = daysLeft <= AGING_WINDOW_DAYS ? "aging" : "fresh";
  const label =
    ageDays === 0
      ? "Verified today"
      : state === "aging"
        ? `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
        : `Verified ${ageDays} day${ageDays === 1 ? "" : "s"} ago`;

  return { state, ageDays, daysLeft, label };
}
