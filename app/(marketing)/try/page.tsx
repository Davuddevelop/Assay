import { Suspense } from "react";

import { ScanReport } from "@/components/scan/scan-report";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { runScan } from "@/lib/scan/run";
import { explainFindings } from "@/lib/anthropic/explain";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";

export const metadata = { title: "Try a scan — Assay" };

// A real scan (fetch app + crawl bundles + probe RLS + Claude explain) can take
// longer than the platform's default function timeout; ask for headroom.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function normalize(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

// The scan runs on the server and can take several seconds; streaming it inside
// <Suspense> keeps the page instant and shows a live "Scanning…" state.
async function ScanResult({ target }: { target: string }) {
  let result;
  try {
    result = await runScan(target);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't reach that app.";
    return (
      <div className="mt-12 rounded-card border border-oxblood/40 bg-oxblood/10 p-6">
        <p className="font-display text-lg font-bold text-ivory">Couldn&rsquo;t scan that app.</p>
        <p className="mt-1 text-sm text-ivory-dim">{message}</p>
      </div>
    );
  }

  // Turn technical findings into plain English + copy-paste fixes (Claude;
  // falls back to the raw text when the key isn't set — a report always renders).
  const explained = await explainFindings(result.findings, result.platform);
  const now = new Date().toISOString();

  const scan: ScanRow = {
    id: "inline",
    user_id: null,
    app_url: target,
    platform: result.platform,
    status: "completed",
    score: result.score,
    verdict: result.verdict,
    is_demo: false,
    error: null,
    created_at: now,
    completed_at: now,
  };

  const findings: ScanFindingRow[] = result.findings.map((f, i) => ({
    id: String(i),
    scan_id: "inline",
    kind: f.kind,
    severity: f.severity,
    title: explained[i]?.title ?? f.title,
    plain_explanation: explained[i]?.plain_explanation ?? f.detail,
    fix_prompt: explained[i]?.fix_prompt ?? `Fix this security issue in my app: ${f.title}. ${f.detail}`,
    manual_steps: (explained[i]?.manual_steps ?? []).join("\n"),
    redacted_location: f.redactedLocation,
    created_at: now,
  }));

  return (
    <div className="mt-12">
      <ScanReport scan={scan} findings={findings} />
    </div>
  );
}

function Scanning({ target }: { target: string }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <Spinner className="h-8 w-8 text-iris-soft" />
      <p className="mt-5 font-display text-xl font-bold text-ivory">Scanning your app…</p>
      <p className="mt-2 max-w-sm text-sm text-ivory-dim">
        Checking <span className="font-mono text-ivory">{target}</span> for exposed keys,
        an open database, and missing protections.
      </p>
    </div>
  );
}

export default async function TryPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const target = url ? normalize(url) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ivory">
        Is your app safe to publish?
      </h1>
      <p className="mt-3 text-ivory-dim">
        Paste your live app URL. Assay checks it for exposed keys, an open database,
        and missing protections — in plain English, no login.
      </p>

      <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="url"
          defaultValue={url ?? ""}
          placeholder="yourapp.lovable.app"
          required
          className="flex-1 rounded-pill border border-line bg-surface px-5 py-3 font-mono text-sm text-ivory outline-none placeholder:text-ash focus:border-iris"
        />
        <Button type="submit" variant="primary" size="md">Scan my app</Button>
      </form>

      {target && (
        <Suspense key={target} fallback={<Scanning target={target} />}>
          <ScanResult target={target} />
        </Suspense>
      )}
    </main>
  );
}
