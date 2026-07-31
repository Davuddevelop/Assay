import type { NextRequest } from "next/server";

import { runScan } from "@/lib/scan/run";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { explainFindings } from "@/lib/anthropic/explain";
import { ScanError } from "@/lib/scan/types";
import { consumeRateLimit } from "@/lib/rate-limit-global";
import { anonBudget } from "@/lib/scan/anon-budget";
import { openScanStat, completeScanStat, failScanStat } from "@/lib/data/scan-stats";
import { log } from "@/lib/log";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANON_LIMIT = 6;
const ANON_WINDOW_SEC = 60;
// A hard daily ceiling per IP on top of the per-minute burst limit — bounds the
// total outbound-fetch cost a single visitor can drive.
const ANON_DAILY_LIMIT = 40;
const DAY_SEC = 86_400;
const HOUR_SEC = 3_600;

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

function normalize(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/**
 * Streams a scan as it happens — a line-by-line NDJSON feed the client renders
 * live (the "watch it work" experience), then a final `done` event with the
 * full report. Real progress: each line is emitted from the actual scan stage.
 */
export async function GET(req: NextRequest) {
  const target = normalize(req.nextUrl.searchParams.get("url") ?? "");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

      // Opened before anything can go wrong and closed on every path out, so a
      // row left reading 'started' means the platform killed us mid-scan — the
      // one failure that cannot report itself.
      let statId: number | null = null;

      try {
        statId = await openScanStat();
        const ip = clientKey(req);
        const withinBurst = await consumeRateLimit(`try:${ip}`, ANON_LIMIT, ANON_WINDOW_SEC);
        const withinDaily =
          withinBurst && (await consumeRateLimit(`try-day:${ip}`, ANON_DAILY_LIMIT, DAY_SEC));
        if (!withinBurst || !withinDaily) {
          failScanStat(statId, "rate_limited");
          send({
            type: "error",
            message: withinBurst
              ? "You've hit today's free-scan limit. Sign in to keep scanning."
              : "You've run a lot of scans in a short time. Wait a minute and try again.",
          });
          controller.close();
          return;
        }

        // Per-IP limits bound one visitor; nothing bounded everyone at once, so
        // a script rotating addresses could bill this account indefinitely. The
        // per-IP gates run first on purpose — an abuser is stopped by their own
        // quota before they can eat into the shared budget.
        const budget = anonBudget(process.env.ANON_SCAN_BUDGET_DAILY);
        const withinGlobalHour = await consumeRateLimit(
          "try-global-hour",
          budget.hourly,
          HOUR_SEC,
        );
        const withinGlobalDay =
          withinGlobalHour &&
          (await consumeRateLimit("try-global-day", budget.daily, DAY_SEC));
        if (!withinGlobalHour || !withinGlobalDay) {
          log.warn("anonymous scan budget reached", {
            window: withinGlobalHour ? "day" : "hour",
            limit: withinGlobalHour ? budget.daily : budget.hourly,
          });
          failScanStat(statId, "rate_limited");
          send({
            type: "error",
            message:
              "Free scanning is busy right now and paused for a moment. Sign in and your scan runs straight away — it's free.",
          });
          controller.close();
          return;
        }
        try {
          await assertScannableUrl(target);
        } catch {
          failScanStat(statId, "rejected_url");
          send({ type: "error", message: "That doesn't look like a public app URL. Try the full link." });
          controller.close();
          return;
        }

        const result = await runScan(target, (line) => send({ type: "log", line }));
        const now = new Date().toISOString();

        const scan: ScanRow = {
          id: "inline", user_id: null, app_url: target, platform: result.platform,
          status: "completed", score: result.score, verdict: result.verdict,
          is_demo: false, error: null, created_at: now, completed_at: now,
        };

        // Raw findings first. The verdict is known the moment the probe ends,
        // and everything after this is enrichment.
        const findings: ScanFindingRow[] = result.findings.map((f, i) => ({
          id: String(i), scan_id: "inline", kind: f.kind, severity: f.severity,
          title: f.title,
          plain_explanation: f.detail,
          fix_prompt: `Fix this security issue in my app: ${f.title}. ${f.detail}`,
          manual_steps: "",
          redacted_location: f.redactedLocation, created_at: now,
        }));

        // Send the report BEFORE explaining it.
        //
        // The explanation step makes one model call across every finding, so the
        // more a scan finds the longer it runs — and the platform kills the
        // function at 60s. That put the slowest stage on the critical path and
        // made badly broken apps, the ones this product exists for, the most
        // likely to die with nothing shown. Now the verdict lands immediately
        // and the plain-English fixes arrive after, so a timeout costs polish
        // instead of the whole result.
        completeScanStat(statId, {
          platform: result.platform,
          verdict: result.verdict,
          score: result.score,
          findings: result.findings,
        });
        send({ type: "done", scan, findings, explaining: result.findings.length > 0 });

        if (result.findings.length > 0) {
          try {
            const explained = await explainFindings(result.findings, result.platform);
            send({
              type: "explained",
              findings: findings.map((f, i) => ({
                ...f,
                title: explained[i]?.title ?? f.title,
                plain_explanation: explained[i]?.plain_explanation ?? f.plain_explanation,
                fix_prompt: explained[i]?.fix_prompt ?? f.fix_prompt,
                manual_steps: (explained[i]?.manual_steps ?? []).join("\n"),
              })),
            });
          } catch (err) {
            // The report is already delivered, so this is a downgrade, not a
            // failure — the reader keeps the technical wording.
            log.warn("explain failed after report sent", {
              reason: err instanceof Error ? err.message : "unknown",
            });
            send({ type: "explained", findings });
          }
        }
      } catch (err) {
        failScanStat(statId, err instanceof ScanError ? "unreachable" : "unknown");
        // The fetcher raises specific, already-plain-English reasons ("it
        // returned HTTP 403", "we couldn't reach that app"). Swallowing them
        // for a generic line left people whose app sits behind Cloudflare with
        // no idea what went wrong. Pass ours through; keep the generic line for
        // anything unrecognised so an internal error never leaks out.
        const message =
          err instanceof ScanError
            ? err.message
            : "We couldn't finish scanning that app. Check the URL is live and public.";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
