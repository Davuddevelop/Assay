import { HallmarkStamp } from "@/components/hallmark-stamp";
import type { CheckRow } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/**
 * Shows a check's outcome: the struck hallmark once complete (Assayed / Held),
 * or a quiet status pill while it's queued, running, or errored.
 */
export function CheckStatus({
  check,
  size = "sm",
}: {
  check: Pick<CheckRow, "status" | "verdict">;
  size?: "sm" | "md";
}) {
  if (check.status === "completed" && check.verdict) {
    return <HallmarkStamp state={check.verdict} animate={false} size={size} />;
  }

  const label =
    check.status === "running"
      ? "Running"
      : check.status === "queued"
        ? "Queued"
        : check.status === "error"
          ? "Error"
          : check.status;

  const tone =
    check.status === "error"
      ? "border-oxblood/50 text-oxblood-soft"
      : "border-border text-ash";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border bg-surface/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
        tone,
      )}
    >
      {check.status === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-iris" />
      )}
      {label}
    </span>
  );
}
