import type { FindingSeverity, FindingType, Verdict } from "@/lib/db/types";

/** The minimal finding shape the verdict depends on. Pure — no I/O. */
export interface VerdictFinding {
  type: FindingType;
  severity: FindingSeverity;
}

const BLOCKING_SEVERITY: ReadonlySet<FindingSeverity> = new Set([
  "high",
  "critical",
]);

// A rule violation, a failing test, or a security issue is blocking on its own —
// these are the things a user explicitly asked Assay to guard. `quality`
// findings are advisory and only block when they're high/critical severity.
const BLOCKING_TYPE: ReadonlySet<FindingType> = new Set([
  "rule",
  "test",
  "security",
]);

export function isBlocking(f: VerdictFinding): boolean {
  return BLOCKING_SEVERITY.has(f.severity) || BLOCKING_TYPE.has(f.type);
}

export interface VerdictResult {
  verdict: Verdict;
  summary: string;
}

/**
 * Decide the hallmark from a set of findings. Deterministic and side-effect
 * free — this is the engine the verdict tests target.
 *
 *   Held    — any blocking finding (severity high/critical, or a rule / test /
 *             security finding at any severity).
 *   Assayed — otherwise (clean, or only low/medium quality notes).
 */
export function decideVerdict(findings: readonly VerdictFinding[]): VerdictResult {
  const blocking = findings.filter(isBlocking);

  if (blocking.length > 0) {
    const n = blocking.length;
    return {
      verdict: "held",
      summary:
        n === 1
          ? "Held — 1 issue must be resolved before this change is sound."
          : `Held — ${n} issues must be resolved before this change is sound.`,
    };
  }

  const notes = findings.length;
  return {
    verdict: "assayed",
    summary:
      notes === 0
        ? "Assayed — no issues found. The change is sound."
        : `Assayed — sound, with ${notes} advisory note${notes === 1 ? "" : "s"}.`,
  };
}
