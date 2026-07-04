/**
 * Compare two scans of the same app — the heart of continuous re-checking.
 * Pure so it's unit-testable; the dashboard uses it to tell a watcher
 * "a change broke something" (or "you fixed it") instead of a raw number.
 */
export interface ScanLike {
  score: number | null;
  verdict: "certified" | "at_risk" | null;
}

export interface ScanDelta {
  /** Current score minus previous score, or null when either is missing. */
  scoreDelta: number | null;
  /** The app got worse: verdict flipped to at-risk, or the score dropped. */
  regression: boolean;
  /** The app got better: verdict flipped to certified, or the score rose. */
  improved: boolean;
}

export function compareScans(
  prev: ScanLike | null,
  current: ScanLike | null,
): ScanDelta {
  if (!prev || !current) return { scoreDelta: null, regression: false, improved: false };

  const scoreDelta =
    prev.score !== null && current.score !== null
      ? current.score - prev.score
      : null;

  const flippedUp = prev.verdict === "at_risk" && current.verdict === "certified";
  const regression =
    (prev.verdict === "certified" && current.verdict === "at_risk") ||
    (scoreDelta !== null && scoreDelta < 0);

  return {
    scoreDelta,
    regression,
    improved: !regression && (flippedUp || (scoreDelta !== null && scoreDelta > 0)),
  };
}
