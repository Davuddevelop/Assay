/**
 * Scanner-level types. Scanners emit technical `RawFinding`s (no secrets, ever);
 * lib/anthropic/explain.ts later turns each into a user-facing finding with a
 * plain-language explanation and a paste-back fix prompt.
 */
export type ScanSeverity = "critical" | "risky" | "minor";

type FindingKind =
  | "exposed-secret"
  | "supabase-rls"
  | "supabase-storage"
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
