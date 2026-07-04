import { inngest, EVENTS } from "@/inngest/client";
import { listActiveMonitors } from "@/lib/data/monitors";
import { createScan } from "@/lib/data/scans";
import { consumeScanUsage } from "@/lib/usage";
import { log } from "@/lib/log";

/**
 * Daily re-check of every watched app — the continuous half of the product.
 * Each re-scan goes through the same metered path as a manual scan (so a watch
 * list can't blow past the plan allowance) and then rides the normal
 * `app/scan.requested` pipeline. Skips, never fails, on a per-app problem.
 */
export const recheckApps = inngest.createFunction(
  {
    id: "recheck-apps",
    name: "Re-scan watched apps",
    triggers: [{ cron: "0 6 * * *" }], // daily, 06:00 UTC
  },
  async ({ step }) => {
    const monitors = await step.run("list-monitors", () => listActiveMonitors());
    if (monitors.length === 0) return { rechecked: 0 };

    const scanIds: string[] = [];
    for (const m of monitors) {
      const scanId = await step.run(`queue-${m.id}`, async () => {
        if (!(await consumeScanUsage(m.user_id, "free"))) {
          log.warn("recheck skipped: monthly limit", { monitorId: m.id });
          return null;
        }
        return createScan(m.user_id, m.app_url);
      });
      if (scanId) scanIds.push(scanId);
    }

    if (scanIds.length > 0) {
      await step.sendEvent(
        "request-scans",
        scanIds.map((scanId) => ({
          name: EVENTS.scanRequested,
          data: { scanId },
        })),
      );
    }

    log.info("recheck fan-out", { watched: monitors.length, queued: scanIds.length });
    return { rechecked: scanIds.length };
  },
);
