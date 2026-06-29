import { CopyButton } from "@/components/scan/copy-button";
import type { ScanFindingRow, ScanFindingSeverity } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const SEVERITY: Record<ScanFindingSeverity, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "border-oxblood text-oxblood-soft" },
  risky: { label: "Risky", cls: "border-oxblood/50 text-oxblood-soft" },
  minor: { label: "Minor", cls: "border-border text-ash" },
};

/** One finding: plain explanation + the paste-back fix prompt + manual steps. */
export function FindingCard({ finding }: { finding: ScanFindingRow }) {
  const sev = SEVERITY[finding.severity] ?? SEVERITY.minor;
  const steps = finding.manual_steps.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-pill border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
            sev.cls,
          )}
        >
          {sev.label}
        </span>
        {finding.redacted_location && (
          <span className="font-mono text-xs text-ash">{finding.redacted_location}</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-ivory">{finding.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{finding.plain_explanation}</p>

      {finding.fix_prompt && (
        <div className="mt-5 rounded-[var(--radius-control)] border border-iris/30 bg-iris/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-iris-soft">
              Paste this into your builder to fix it
            </p>
            <CopyButton text={finding.fix_prompt} />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ivory">
            {finding.fix_prompt}
          </p>
        </div>
      )}

      {steps.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory">
            Prefer to do it by hand?
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ivory-dim">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
