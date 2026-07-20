import { CopyButton } from "@/components/scan/copy-button";
import { RecheckButton } from "@/components/scan/recheck-button";
import type { ScanFindingRow, ScanFindingSeverity } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const SEVERITY: Record<ScanFindingSeverity, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "border-oxblood text-oxblood-soft" },
  risky: { label: "Risky", cls: "border-oxblood/50 text-oxblood-soft" },
  minor: { label: "Minor", cls: "border-border text-ash" },
};

/** Split a "table: col, col" evidence string into a label + individual chips. */
function parseEvidence(location: string): { label: string | null; items: string[] } {
  const idx = location.indexOf(":");
  if (idx === -1) {
    return { label: null, items: location.split(",").map((s) => s.trim()).filter(Boolean) };
  }
  return {
    label: location.slice(0, idx).trim(),
    items: location.slice(idx + 1).split(",").map((s) => s.trim()).filter(Boolean),
  };
}

/** One finding: plain explanation + the paste-back fix prompt + manual steps. */
export function FindingCard({
  finding,
  recheckable = false,
}: {
  finding: ScanFindingRow;
  recheckable?: boolean;
}) {
  const sev = SEVERITY[finding.severity] ?? SEVERITY.minor;
  const steps = finding.manual_steps.split("\n").map((s) => s.trim()).filter(Boolean);

  // Database / storage exposure gets the visceral "here's your leaked data"
  // treatment — the columns or files anyone can reach right now, shown loud.
  const isExposure =
    (finding.kind === "supabase-rls" || finding.kind === "supabase-storage") &&
    Boolean(finding.redacted_location);
  const evidence = isExposure ? parseEvidence(finding.redacted_location as string) : null;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-6",
        isExposure ? "border-oxblood/50 bg-oxblood/5" : "border-line bg-surface/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-pill border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
            sev.cls,
          )}
        >
          {sev.label}
        </span>
        {finding.redacted_location && !isExposure && (
          <span className="font-mono text-xs text-ash">{finding.redacted_location}</span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-ivory">{finding.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{finding.plain_explanation}</p>

      {evidence && evidence.items.length > 0 && (
        <div className="mt-5 rounded-[var(--radius-control)] border border-oxblood/40 bg-oxblood/10 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-oxblood-soft">
            Exposed right now · no login required
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {evidence.label && (
              <span className="font-mono text-xs text-ivory">{evidence.label}</span>
            )}
            {evidence.items.map((item) => (
              <span
                key={item}
                className="rounded-pill border border-oxblood/40 bg-oxblood/10 px-2.5 py-0.5 font-mono text-[11px] text-oxblood-soft"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {recheckable && <RecheckButton scanId={finding.scan_id} findingId={finding.id} />}
    </div>
  );
}
