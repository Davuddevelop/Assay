import {
  inngest,
  EVENTS,
  type ScanRequestedEventData,
} from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { runScan as executeScan } from "@/lib/scan/run";
import { explainFindings } from "@/lib/anthropic/explain";
import { log } from "@/lib/log";

/**
 * Durable scan job: fetch the app, run the checks, translate findings into
 * plain language + fix prompts, persist, and score. Never logs secrets or the
 * scanned app's data.
 */
export const runScan = inngest.createFunction(
  { id: "run-scan", name: "Scan an app", triggers: [{ event: EVENTS.scanRequested }] },
  async ({ event, step }) => {
    const { scanId } = event.data as ScanRequestedEventData;
    const db = createAdminClient();

    const { data: scan } = await db
      .from("scans")
      .select("id, app_url")
      .eq("id", scanId)
      .single();
    if (!scan) return { skipped: "no-scan" };

    await step.run("mark-running", async () => {
      await db.from("scans").update({ status: "running" }).eq("id", scanId);
    });

    try {
      const result = await step.run("scan", () => executeScan(scan.app_url));
      const explained = await step.run("explain", () =>
        explainFindings(result.findings, result.platform),
      );

      await step.run("save", async () => {
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
      });

      log.info("scan completed", { scanId, score: result.score });
      return { scanId, score: result.score, verdict: result.verdict };
    } catch {
      await db
        .from("scans")
        .update({ status: "error", error: "We couldn't finish scanning that app." })
        .eq("id", scanId);
      log.error("scan failed", { scanId });
      return { scanId, error: true };
    }
  },
);
