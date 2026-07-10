import { FindingCard } from "@/components/scan/finding-card";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import type { ScanRow, ScanFindingRow, ScanFindingSeverity } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const ORDER: ScanFindingSeverity[] = ["critical", "risky", "minor"];

function countBy(findings: ScanFindingRow[], sev: ScanFindingSeverity) {
  return findings.filter((f) => f.severity === sev).length;
}

/** The scan report: score + verdict header, then findings worst-first. */
export function ScanReport({
  scan,
  findings,
}: {
  scan: ScanRow;
  findings: ScanFindingRow[];
}) {
  const certified = scan.verdict === "certified";
  const sorted = [...findings].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
  );

  const counts: { label: string; n: number; cls: string }[] = [
    { label: "Critical", n: countBy(findings, "critical"), cls: "text-oxblood-soft" },
    { label: "Risky", n: countBy(findings, "risky"), cls: "text-oxblood-soft/90" },
    { label: "Minor", n: countBy(findings, "minor"), cls: "text-ash" },
  ];

  return (
    <div>
      {/* audit header — a report readout, not a marketing hero */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-2.5">
          <p className="truncate font-mono text-xs text-ash">{scan.app_url}</p>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
            Security audit
          </span>
        </div>

        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  certified ? "bg-iris" : "bg-oxblood",
                )}
              />
              <span
                className={cn(
                  "font-mono text-[11px] uppercase tracking-[0.18em]",
                  certified ? "text-iris-soft" : "text-oxblood-soft",
                )}
              >
                {certified ? "Passed" : "Action required"}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-[2.6rem]">
              {certified ? "Safe to publish." : "Not safe to publish — yet."}
            </h1>

            {/* severity readout */}
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
              {counts.map((c) => (
                <div key={c.label} className="flex items-baseline gap-2">
                  <span className={cn("font-display text-2xl font-bold tabular-nums", c.cls)}>
                    {c.n}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5 border-t border-line pt-5 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display text-5xl font-bold tabular-nums",
                  certified ? "text-iris-soft" : "text-oxblood-soft",
                )}
              >
                {scan.score ?? "—"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                / 100
              </span>
            </div>
            <HallmarkStamp state={certified ? "assayed" : "held"} animate={false} />
          </div>
        </div>
      </div>

      {/* findings */}
      <div className="mt-6 space-y-4">
        {sorted.length > 0 ? (
          sorted.map((f) => <FindingCard key={f.id} finding={f} />)
        ) : (
          <div className="rounded-[var(--radius-card)] border border-line bg-surface/40 px-6 py-12 text-center text-sm text-ivory-dim">
            No issues found. Your app passed every check.
          </div>
        )}
      </div>
    </div>
  );
}
