/**
 * Data receipt — the honest, concrete answer to "what did this tool just do to
 * my app, and what did it keep?" A security scanner asking to hit your live app
 * is exactly the thing a security-anxious owner distrusts, so we account for our
 * restraint explicitly: values redacted, zero rows of user data read, and only
 * the findings shown above retained. Pure so it's unit-testable.
 */
export interface ScanReceipt {
  /** Exposed secrets detected — recorded by location only, never by value. */
  secretsSeen: number;
  /** How many findings were kept (titles + redacted locations shown above). */
  findingsKept: number;
}

export function buildReceipt(findings: { kind: string }[]): ScanReceipt {
  const secretsSeen = findings.filter((f) => f.kind === "exposed-secret").length;
  return { secretsSeen, findingsKept: findings.length };
}
