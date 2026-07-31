import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import type { ScanFindingSeverity } from "@/lib/db/types";

/**
 * Record the shape of an anonymous scan — never who ran it or what they
 * scanned.
 *
 * /try previously kept nothing at all, so the most-used path in the product
 * produced no evidence it had run. This stores only the result's shape:
 * platform, verdict, score, and how many findings of each severity. No URL, no
 * IP, no account. That is a deliberate line — the URL is the one field that
 * could identify someone's project, and the privacy policy promises restraint.
 *
 * Fire-and-forget by design: a telemetry write must never fail a scan or make
 * the person wait for it.
 */
export function recordScanStat(input: {
  platform: string;
  verdict: string;
  score: number;
  findings: { severity: ScanFindingSeverity }[];
}): void {
  const count = (sev: ScanFindingSeverity) =>
    input.findings.filter((f) => f.severity === sev).length;

  try {
    const db = createAdminClient();
    void db
      .from("scan_stats")
      .insert({
        platform: input.platform,
        verdict: input.verdict,
        score: input.score,
        critical: count("critical"),
        risky: count("risky"),
        minor: count("minor"),
      })
      .then(({ error }) => {
        if (error) log.warn("scan stat write failed", { reason: error.message });
      });
  } catch (err) {
    log.warn("scan stat write failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}
