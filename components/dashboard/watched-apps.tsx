import Link from "next/link";

import { HallmarkStamp } from "@/components/hallmark-stamp";
import { relativeTime } from "@/lib/data/derive";
import type { WatchedAppStatus } from "@/lib/data/monitors";
import { cn } from "@/lib/utils";

function Delta({ status }: { status: WatchedAppStatus }) {
  const { delta } = status;
  if (delta.regression) {
    return (
      <span className="rounded-pill border border-oxblood/50 bg-oxblood/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-oxblood-soft">
        {delta.scoreDelta !== null ? `↓ ${Math.abs(delta.scoreDelta)} — ` : ""}a change broke something
      </span>
    );
  }
  if (delta.improved) {
    return (
      <span className="rounded-pill border border-iris/40 bg-iris/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
        {delta.scoreDelta !== null ? `↑ ${delta.scoreDelta} — ` : ""}fixed
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
      steady
    </span>
  );
}

/**
 * The watched-apps board — the first thing on the dashboard. Each row is a
 * daily re-checked app: its latest verdict, score, and whether the last change
 * made it better or worse.
 */
export function WatchedApps({ apps }: { apps: WatchedAppStatus[] }) {
  if (apps.length === 0) return null;

  return (
    <section>
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
        Watched apps · re-checked daily
      </h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
        {apps.map((status) => {
          const { monitor, latest } = status;
          const row = (
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-5 py-4",
                latest && "transition-colors hover:bg-surface-hover/40",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-ivory">{monitor.app_url}</p>
                <p className="mt-1 font-mono text-xs text-ash">
                  {latest?.completed_at
                    ? `checked ${relativeTime(latest.completed_at)}`
                    : "first check runs tonight"}
                  {latest?.score !== null && latest?.score !== undefined
                    ? ` · score ${latest.score}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Delta status={status} />
                {latest?.verdict && (
                  <HallmarkStamp
                    state={latest.verdict === "certified" ? "assayed" : "held"}
                    animate={false}
                    size="sm"
                  />
                )}
              </div>
            </div>
          );
          return (
            <li key={monitor.id}>
              {latest ? <Link href={`/scan/${latest.id}`}>{row}</Link> : row}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
