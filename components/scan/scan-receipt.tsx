import { buildReceipt } from "@/lib/scan/receipt";
import type { ScanFindingRow } from "@/lib/db/types";

/**
 * The data receipt shown under a report — turns Assay's restraint into
 * something the owner can read. Every line is true of every scan: we redact
 * secret values before saving, we never read a row of user data, and we keep
 * only the findings on this page. This is what earns trust from the exact
 * audience (security-anxious owners) most likely to distrust the scan.
 */
export function ScanReceipt({ findings }: { findings: ScanFindingRow[] }) {
  const receipt = buildReceipt(findings);

  const lines = [
    receipt.secretsSeen > 0
      ? `${receipt.secretsSeen} exposed secret${receipt.secretsSeen === 1 ? "" : "s"} seen — 0 stored. We record where a key leaked, never the key itself.`
      : "No secrets found — and we never store a secret value even when we do.",
    "0 rows of your data read. Database checks confirm access is open or closed; they never pull your users' records.",
    `We kept the ${receipt.findingsKept} finding${receipt.findingsKept === 1 ? "" : "s"} above and nothing else — no page content, no source code, no secrets.`,
  ];

  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface/30 p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
        What Assay kept from this scan
      </p>
      <ul className="mt-4 space-y-2.5">
        {lines.map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ivory-dim">
            <span aria-hidden className="mt-0.5 shrink-0 text-iris-soft">
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] leading-relaxed text-ash">
        Read-only, ownership-gated, SSRF-guarded. We scan only what a browser can
        already see.
      </p>
    </div>
  );
}
