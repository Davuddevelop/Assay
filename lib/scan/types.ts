/**
 * Scanner-level types. Scanners emit technical `RawFinding`s (no secrets, ever);
 * lib/anthropic/explain.ts later turns each into a user-facing finding with a
 * plain-language explanation and a paste-back fix prompt.
 */
export type ScanSeverity = "critical" | "risky" | "minor";

/**
 * A scan failure whose message is already written for the person who submitted
 * the URL ("it returned HTTP 403", "that app redirected too many times").
 * Callers can surface `.message` directly; anything that is a plain `Error` is
 * an internal fault and must be replaced with a generic line instead.
 */
export class ScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanError";
  }
}

type FindingKind =
  | "exposed-secret"
  | "supabase-rls"
  | "supabase-storage"
  | "firebase-rules"
  | "open-endpoint"
  | "missing-header"
  | "vulnerable-dependency";

export interface RawFinding {
  kind: FindingKind;
  severity: ScanSeverity;
  /** Short technical title, e.g. "Supabase service key exposed in browser". */
  title: string;
  /** Technical detail for the explain step — MUST NOT contain a secret value. */
  detail: string;
  /** Where it was found, with any secret value redacted. */
  redactedLocation: string | null;
}
