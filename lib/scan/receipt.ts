/**
 * Data receipt — the honest, concrete answer to "what did this tool just do to
 * my app, and what did it keep?" A security scanner asking to hit your live app
 * is exactly the thing a security-anxious owner distrusts, so we account for our
 * restraint explicitly: values redacted, rows masked, and only the findings
 * shown above retained. Pure so it's unit-testable.
 *
 * `readRows` exists because the receipt used to claim a flat "0 rows of your
 * data read", and proof-of-exposure made that untrue: to show you that your
 * database is readable we now read a few rows, mask them before they reach the
 * screen, and store none of them. Claiming otherwise on the one surface whose
 * entire job is honesty would be worse than the feature is good.
 *
 * It is derived from the finding *kind*, not only from the in-memory proof:
 * proof is never persisted, so a saved report would otherwise reprint the old
 * claim. A supabase-rls or firebase-rules finding means we asked the database
 * for records and it answered — true even when the table came back empty.
 */
const ROW_READING_KINDS = new Set(["supabase-rls", "firebase-rules"]);
export interface ScanReceipt {
  /** Exposed secrets detected — recorded by location only, never by value. */
  secretsSeen: number;
  /** How many findings were kept (titles + redacted locations shown above). */
  findingsKept: number;
  /** True when a finding proved readability by actually pulling sample rows. */
  readRows: boolean;
}

export function buildReceipt(
  findings: { kind: string; proof?: unknown }[],
): ScanReceipt {
  const secretsSeen = findings.filter((f) => f.kind === "exposed-secret").length;
  const readRows = findings.some((f) => f.proof != null || ROW_READING_KINDS.has(f.kind));
  return { secretsSeen, findingsKept: findings.length, readRows };
}
