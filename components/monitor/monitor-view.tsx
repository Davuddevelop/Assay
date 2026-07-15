import { HallmarkStamp } from "@/components/hallmark-stamp";
import { buildActivity, type HistoryScan, type ActivityKind } from "@/lib/monitor/activity";
import { relativeTime } from "@/lib/data/derive";
import { cn } from "@/lib/utils";

const KIND_DOT: Record<ActivityKind, string> = {
  baseline: "bg-ash",
  steady: "bg-iris",
  regression: "bg-oxblood",
  fixed: "bg-iris-soft",
};

/** Score-over-time trend as a small inline SVG (area + line + endpoint). */
function Trend({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 480;
  const h = 88;
  const pad = 6;
  const max = 100;
  const min = 0;
  const stepX = (w - pad * 2) / (scores.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const pts = scores.map((s, i) => [pad + i * stepX, y(s)] as const);
  const line = pts.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${yy.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`;
  const [ex, ey] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-iris)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-iris)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend-fill)" />
      <path d={line} fill="none" stroke="var(--color-iris)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle cx={ex} cy={ey} r="3" fill="var(--color-iris-soft)" />
    </svg>
  );
}

/**
 * The continuous-tracking page: Assay is always watching this app. Shows the
 * current status, a score-over-time trend, and the agent's activity timeline —
 * the ongoing relationship, not a one-time scan.
 */
export function MonitorView({
  appUrl,
  scans,
  nextCheckHours,
}: {
  appUrl: string;
  scans: HistoryScan[]; // oldest → newest
  nextCheckHours: number;
}) {
  const latest = scans[scans.length - 1];
  const certified = latest?.verdict === "certified";
  const events = buildActivity(scans);
  const trendScores = scans.map((s) => s.score ?? 0);

  return (
    <div className="space-y-6">
      {/* status header */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-2.5">
          <p className="truncate font-mono text-xs text-ash">{appUrl}</p>
          <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-iris-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-soft opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-iris" />
            </span>
            Watching
          </span>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
              Assay checked this app {latest ? relativeTime(latest.at) : "recently"} · next check in ~{nextCheckHours}h
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
              {certified ? "Still safe to publish." : "Needs attention."}
            </h1>
            <p className="mt-2 text-sm text-ivory-dim">
              Every edit you ship can reopen a hole. Assay re-checks the whole app
              daily and flags it here the moment something breaks — before your
              users find it.
            </p>
          </div>
          <div className="flex items-center gap-5 border-t border-line pt-5 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display text-5xl font-bold tabular-nums",
                  certified ? "text-iris-soft" : "text-oxblood-soft",
                )}
              >
                {latest?.score ?? "—"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">/ 100</span>
            </div>
            <HallmarkStamp state={certified ? "assayed" : "held"} animate={false} />
          </div>
        </div>

        {/* trend */}
        <div className="border-t border-line px-6 pb-5 pt-4 sm:px-7">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Safety score · last {scans.length} checks
          </p>
          <Trend scores={trendScores} />
        </div>
      </div>

      {/* activity timeline */}
      <div className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6 sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">Activity</p>
        <ol className="mt-5 space-y-0">
          {events.map((e, i) => (
            <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < events.length - 1 && (
                <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line" />
              )}
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", KIND_DOT[e.kind])} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-ivory">{e.headline}</span>
                  {e.scoreDelta !== null && e.scoreDelta !== 0 && (
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        e.scoreDelta < 0 ? "text-oxblood-soft" : "text-iris-soft",
                      )}
                    >
                      {e.scoreDelta > 0 ? "+" : ""}
                      {e.scoreDelta}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-ash">{relativeTime(e.at)}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ivory-dim">{e.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
