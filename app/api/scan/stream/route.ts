import type { NextRequest } from "next/server";

import { runScan } from "@/lib/scan/run";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { explainFindings } from "@/lib/anthropic/explain";
import { rateLimit } from "@/lib/rate-limit";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANON_LIMIT = 6;
const ANON_WINDOW_MS = 60_000;

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

      try {
        if (!rateLimit(`try:${clientKey(req)}`, ANON_LIMIT, ANON_WINDOW_MS).ok) {
          send({ type: "error", message: "You've run a lot of scans in a short time. Wait a minute and try again." });
          controller.close();
          return;
        }
        try {
          await assertScannableUrl(target);
        } catch {
          send({ type: "error", message: "That doesn't look like a public app URL. Try the full link." });
          controller.close();
          return;
        }

        const result = await runScan(target, (line) => send({ type: "log", line }));

        send({ type: "log", line: "Writing plain-English fixes…" });
        const explained = await explainFindings(result.findings, result.platform);
        const now = new Date().toISOString();

        const scan: ScanRow = {
          id: "inline", user_id: null, app_url: target, platform: result.platform,
          status: "completed", score: result.score, verdict: result.verdict,
          is_demo: false, error: null, created_at: now, completed_at: now,
        };
        const findings: ScanFindingRow[] = result.findings.map((f, i) => ({
          id: String(i), scan_id: "inline", kind: f.kind, severity: f.severity,
          title: explained[i]?.title ?? f.title,
          plain_explanation: explained[i]?.plain_explanation ?? f.detail,
          fix_prompt: explained[i]?.fix_prompt ?? `Fix this security issue in my app: ${f.title}. ${f.detail}`,
          manual_steps: (explained[i]?.manual_steps ?? []).join("\n"),
          redacted_location: f.redactedLocation, created_at: now,
        }));

        send({ type: "done", scan, findings });
      } catch {
        send({ type: "error", message: "We couldn't finish scanning that app. Check the URL is live and public." });
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
