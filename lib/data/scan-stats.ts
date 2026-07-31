import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import type { ScanFindingSeverity } from "@/lib/db/types";

/**
 * The fixed set of reasons a scan can fail. Buckets, never messages — a raw
 * error string can carry the hostname someone scanned, and this table is
 * deliberately unable to identify anyone.
 */
export type ScanFailureReason =
  | "rate_limited"
  | "rejected_url"
  | "unreachable"
  | "explain_failed"
  | "unknown";

/**
 * Record the shape of an anonymous scan — never who ran it or what they
 * scanned.
 *
 * A row is opened when the scan starts and closed when it resolves. That shape
 * exists because the failure we most needed to see was the one where the
 * platform kills the function mid-scan: no code of ours runs, so nothing can be
 * written at the end. A row still reading 'started' is that timeout.
 *
 * Opening the row is the one telemetry write that is awaited, because the id is
 * needed to close it. Every write after that is fire-and-forget: telemetry must
 * never fail a scan or make someone wait for it.
 */
export async function openScanStat(): Promise<number | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("scan_stats")
      .insert({ platform: "unknown", outcome: "started" })
      .select("id")
      .single();
    if (error) {
      log.warn("scan stat open failed", { reason: error.message });
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    log.warn("scan stat open failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

/** Close an open row as a completed scan, with the shape of what it found. */
export function completeScanStat(
  id: number | null,
  input: {
    platform: string;
    verdict: string;
    score: number;
    findings: { severity: ScanFindingSeverity }[];
  },
): void {
  if (id === null) return;
  const count = (sev: ScanFindingSeverity) =>
    input.findings.filter((f) => f.severity === sev).length;

  update(id, {
    outcome: "completed",
    platform: input.platform,
    verdict: input.verdict,
    score: input.score,
    critical: count("critical"),
    risky: count("risky"),
    minor: count("minor"),
  });
}

/** Close an open row as a failure, in one of the fixed buckets. */
export function failScanStat(id: number | null, reason: ScanFailureReason): void {
  if (id === null) return;
  update(id, { outcome: "failed", failure_reason: reason });
}

function update(id: number, patch: Record<string, unknown>): void {
  try {
    const db = createAdminClient();
    void db
      .from("scan_stats")
      .update({ ...patch, resolved_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error }) => {
        if (error) log.warn("scan stat write failed", { reason: error.message });
      });
  } catch (err) {
    log.warn("scan stat write failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}
