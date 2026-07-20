import {
  inngest,
  EVENTS,
  type ScanRequestedEventData,
} from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeAndSaveScan } from "@/lib/scan/execute";
import { notifyOnScanResult } from "@/lib/email/notify";

/**
 * Durable scan job — the async path for whoever/whatever has Inngest wired up
 * (the daily watch-list re-check). The synchronous /scan action shares the
 * same executeAndSaveScan() logic directly, so both paths behave identically.
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

    await step.run("execute", () => executeAndSaveScan(scanId, scan.app_url));

    // If this was a watched app and the scan regressed, email the owner. Its
    // own step so a delivery hiccup retries without re-running the scan.
    await step.run("notify", () => notifyOnScanResult(scanId));

    return { scanId };
  },
);
