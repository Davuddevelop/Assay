import type { FindingRow } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  rule: "Rule",
  security: "Security",
  test: "Test",
  quality: "Quality",
};

const SEVERITY_TONE: Record<string, string> = {
  critical: "border-oxblood text-oxblood-soft",
  high: "border-oxblood/60 text-oxblood-soft",
  medium: "border-border text-ivory-dim",
  low: "border-border text-ash",
};

/** A single finding: type + severity, message, location, and a suggested fix. */
export function FindingItem({ finding }: { finding: FindingRow }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-surface/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-pill border bg-surface/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
            SEVERITY_TONE[finding.severity] ?? "border-border text-ash",
          )}
        >
          {TYPE_LABEL[finding.type] ?? finding.type} · {finding.severity}
        </span>
        {finding.file && (
          <span className="font-mono text-xs text-ash">
            {finding.file}
            {finding.line ? `:${finding.line}` : ""}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ivory">{finding.message}</p>

      {finding.suggestion && (
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-iris-soft">
            Fix
          </span>{" "}
          {finding.suggestion}
        </p>
      )}
    </div>
  );
}
