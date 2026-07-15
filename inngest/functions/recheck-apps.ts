import { inngest, EVENTS } from "@/inngest/client";
import { listActiveMonitors, updateMonitorFingerprint } from "@/lib/data/monitors";
import { createScan } from "@/lib/data/scans";
import { fetchFingerprintSource } from "@/lib/scan/fetch";
import { computeFingerprint } from "@/lib/scan/fingerprint";
import { consumeScanUsage } from "@/lib/usage";
import { log } from "@/lib/log";

/**
 * Change-detected monitoring — the paid heart of the product.
 *
 * Runs often and cheaply: for each watched app it fetches just the HTML +
 * bundle URLs and fingerprints them. If nothing changed, it does nothing (no
 * scan, no credit spent). If the app CHANGED — the moment the owner shipped an
 * edit — it runs a full re-scan through the normal pipeline. That re-scan's
 * diff is the "you just reopened a hole" alert the whole subscription is worth.
 * Never fails on a per-app problem (unreachable app, etc.).
 */
export const recheckApps = inngest.createFunction(
  {
    id: "recheck-apps",
    name: "Re-scan watched apps on change",
    triggers: [{ cron: "0 */3 * * *" }], // every 3 hours — cheap fingerprint check
  },
  async ({ step }) => {
    const monitors = await step.run("list-monitors", () => listActiveMonitors());
    if (monitors.length === 0) return { checked: 0, changed: 0 };

    const scanIds: string[] = [];
    for (const m of monitors) {
      const scanId = await step.run(`check-${m.id}`, async () => {
        let fingerprint: string;
        try {
          const src = await fetchFingerprintSource(m.app_url);
          fingerprint = computeFingerprint(src.html, src.bundleUrls);
        } catch {
          return null; // unreachable / blocked — try again next cycle
        }

        // First look establishes the baseline without scanning again.
        const isFirstLook = m.last_fingerprint === null;
        const changed = !isFirstLook && m.last_fingerprint !== fingerprint;
        await updateMonitorFingerprint(m.id, fingerprint);

        if (!changed) return null; // nothing shipped since last check → nothing to do

        // The app changed — this is the moment worth a full re-scan.
        if (!(await consumeScanUsage(m.user_id, "free"))) {
          log.warn("recheck skipped: monthly limit", { monitorId: m.id });
          return null;
        }
        log.info("change detected — re-scanning", { monitorId: m.id });
        return createScan(m.user_id, m.app_url);
      });
      if (scanId) scanIds.push(scanId);
    }

    if (scanIds.length > 0) {
      await step.sendEvent(
        "request-scans",
        scanIds.map((scanId) => ({ name: EVENTS.scanRequested, data: { scanId } })),
      );
    }

    log.info("monitor sweep", { checked: monitors.length, changed: scanIds.length });
    return { checked: monitors.length, changed: scanIds.length };
  },
);
