import type { RawFinding } from "@/lib/scan/types";
import type { ScanVerdict } from "@/lib/db/types";

const WEIGHT: Record<RawFinding["severity"], number> = {
  critical: 45,
  risky: 18,
  minor: 6,
};

export interface Score {
  score: number;
  verdict: ScanVerdict;
}

/**
 * Turn findings into a 0–100 safety score and a verdict. Pure and strict:
 * "Certified safe to publish" requires zero critical AND zero risky findings —
 * a clean bill, not just a passing grade. Minor issues lower the score but
 * don't block certification.
 */
export function scoreFindings(findings: readonly { severity: RawFinding["severity"] }[]): Score {
  const penalty = findings.reduce((sum, f) => sum + WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasRisky = findings.some((f) => f.severity === "risky");
  const verdict: ScanVerdict = !hasCritical && !hasRisky ? "certified" : "at_risk";

  return { score, verdict };
}
