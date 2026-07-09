import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { runScan } from "@/lib/scan/run";
import { explainFindings } from "@/lib/anthropic/explain";
import { log } from "@/lib/log";

/**
 * Run a scan and persist the result — the one place that decides how a scan's
 * outcome gets saved, shared by the synchronous /scan action and the durable
 * Inngest job, so the two paths can never drift apart.
 */
export async function executeAndSaveScan(scanId: string, appUrl: string): Promise<void> {
  const db = createAdminClient();
  try {
    const result = await runScan(appUrl);
    const explained = await explainFindings(result.findings, result.platform);

    await db.from("scan_findings").delete().eq("scan_id", scanId);
    if (result.findings.length > 0) {
      const rows = result.findings.map((f, i) => ({
        scan_id: scanId,
        kind: f.kind,
        severity: f.severity,
        title: explained[i]?.title ?? f.title,
        plain_explanation: explained[i]?.plain_explanation ?? f.detail,
        fix_prompt: explained[i]?.fix_prompt ?? "",
        manual_steps: (explained[i]?.manual_steps ?? []).join("\n"),
        redacted_location: f.redactedLocation,
      }));
      const { error } = await db.from("scan_findings").insert(rows);
      if (error) throw new Error(`insert findings: ${error.message}`);
    }
    await db
      .from("scans")
      .update({
        status: "completed",
        score: result.score,
        verdict: result.verdict,
        platform: result.platform,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);

    log.info("scan completed", { scanId, score: result.score });
  } catch {
    await db
      .from("scans")
      .update({ status: "error", error: "We couldn't finish scanning that app." })
      .eq("id", scanId);
    log.error("scan failed", { scanId });
  }
}
