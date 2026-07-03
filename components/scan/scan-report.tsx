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

  return (
    <div>
      {/* header */}
      <div className="panel relative overflow-hidden p-8 sm:p-10">
        <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-30" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-ash">{scan.app_url}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
              {certified ? "Safe to publish." : "Not safe to publish — yet."}
            </h1>
            <p className="mt-2 text-sm text-ivory-dim">
              {certified
                ? "No critical or risky issues found. You earned the hallmark."
                : `${countBy(findings, "critical")} critical · ${countBy(findings, "risky")} risky · ${countBy(findings, "minor")} minor`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 font-display",
                certified ? "border-iris text-iris-soft" : "border-oxblood text-oxblood-soft",
              )}
            >
              <span className="text-2xl font-bold leading-none">{scan.score ?? "—"}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em]">score</span>
            </div>
            {certified ? (
              <HallmarkStamp state="assayed" animate={false} />
            ) : (
              <HallmarkStamp state="held" animate={false} />
            )}
          </div>
        </div>
      </div>

      {/* findings */}
      <div className="mt-8 space-y-4">
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
