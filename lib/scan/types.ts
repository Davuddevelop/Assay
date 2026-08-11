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
  // A header that is present but doesn't do its job — a CSP that never
  // restricts scripts, an HSTS that expires in weeks. Distinct from
  // "missing-header" because the fix is different ("tighten this" rather than
  // "add this"), and because re-check must be able to tell them apart.
  | "weak-header"
  | "vulnerable-dependency";

/**
 * A redacted preview of data that was actually reachable without auth. Every
 * value here has passed through lib/scan/redact — masked by type, capped, and
 * proven by tests to reveal nothing that could identify or contact a person.
 * This is the "here are real records we just pulled from your database" proof.
 */
export interface ExposureProof {
  /** The table the rows came from. */
  table: string;
  /** How many rows the unauthenticated request returned in total. */
  rowCount: number;
  /** A few redacted rows — each a list of {column, masked value}. */
  rows: { column: string; value: string }[][];
}

export interface RawFinding {
  kind: FindingKind;
  severity: ScanSeverity;
  /** Short technical title, e.g. "Supabase service key exposed in browser". */
  title: string;
  /** Technical detail for the explain step — MUST NOT contain a secret value. */
  detail: string;
  /** Where it was found, with any secret value redacted. */
  redactedLocation: string | null;
  /**
   * Redacted proof this was live, when the check could safely capture it. Never
   * contains a raw value. Passed straight to the report, never to the AI.
   */
  proof?: ExposureProof;
}
