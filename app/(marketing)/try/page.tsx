import { ScanReport } from "@/components/scan/scan-report";
import { Button } from "@/components/ui/button";
import { runScan } from "@/lib/scan/run";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";
import type { RawFinding } from "@/lib/scan/types";

export const metadata = { title: "Try a scan — Assay" };

// The MVP core, end to end and login-free: paste a URL, run the real scanner
// synchronously, render the verdict + findings. No DB, no async jobs, no auth —
// those layers come later. Claude-written explanations land later too; for now
// the finding's own technical detail is the explanation.
function toFinding(f: RawFinding, i: number, now: string): ScanFindingRow {
  return {
    id: String(i),
    scan_id: "inline",
    kind: f.kind,
    severity: f.severity,
    title: f.title,
    plain_explanation: f.detail,
    fix_prompt: `Fix this security issue in my app: ${f.title}. ${f.detail} Apply the correct fix and show me the change.`,
    manual_steps: "",
    redacted_location: f.redactedLocation,
    created_at: now,
  };
}

export default async function TryPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  let result: { scan: ScanRow; findings: ScanFindingRow[] } | null = null;
  let error: string | null = null;

  if (url) {
    const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    try {
      const r = await runScan(target);
      const now = new Date().toISOString();
      result = {
        scan: {
          id: "inline",
          user_id: null,
          app_url: target,
          platform: r.platform,
          status: "completed",
          score: r.score,
          verdict: r.verdict,
          is_demo: false,
          error: null,
          created_at: now,
          completed_at: now,
        },
        findings: r.findings.map((f, i) => toFinding(f, i, now)),
      };
    } catch (e) {
      error = e instanceof Error ? e.message : "Couldn't reach that app.";
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ivory">
        Is your app safe to publish?
      </h1>
      <p className="mt-3 text-ivory-dim">
        Paste your live app URL. Assay checks it for exposed keys, an open database,
        and missing protections — no login.
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
        <Button type="submit" variant="primary" size="md">
          Scan my app
        </Button>
      </form>

      {error && (
        <div className="mt-10 rounded-card border border-oxblood/40 bg-oxblood/10 p-5">
          <p className="font-display text-lg font-bold text-ivory">
            Couldn&rsquo;t scan that app.
          </p>
          <p className="mt-1 text-sm text-ivory-dim">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-12">
          <ScanReport scan={result.scan} findings={result.findings} />
        </div>
      )}
    </main>
  );
}
