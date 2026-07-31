import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Onboarding } from "@/components/onboarding";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import { WatchedApps } from "@/components/dashboard/watched-apps";
import { requireUser, toSessionUser } from "@/lib/auth";
import { listScans } from "@/lib/data/scans";
import { listWatchedApps } from "@/lib/data/monitors";
import { relativeTime, groupScansByApp } from "@/lib/data/derive";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard — Assay",
  description: "Your app security scans.",
  robots: { index: false, follow: true },
};

export default async function DashboardPage() {
  const session = toSessionUser(await requireUser());
  const [scans, watched] = await Promise.all([listScans(), listWatchedApps()]);
  const hasScans = scans.length > 0;

  // One row per app, not one per scan. See groupScansByApp for why.
  const apps = groupScansByApp(scans);
  const needsAttention = apps.filter((a) => a.latest.verdict !== "certified").length;

  return (
    <div className="relative mx-auto w-full max-w-5xl xl:max-w-6xl px-4 py-16 sm:px-6">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-40" />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            {session.name}&rsquo;s workspace
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
            {!hasScans
              ? "Nothing scanned yet."
              : needsAttention > 0
                ? `${needsAttention} ${needsAttention === 1 ? "app needs" : "apps need"} attention.`
                : apps.length === 1
                  ? "Your app is clear."
                  : "All clear."}
          </h1>
          {hasScans && (
            <p className="mt-2 text-sm text-ivory-dim">
              {apps.length} {apps.length === 1 ? "app" : "apps"} ·{" "}
              {scans.length} {scans.length === 1 ? "check" : "checks"} run
              {watched.length > 0 && ` · ${watched.length} watched`}
            </p>
          )}
        </div>
        {/* Always offered. Hiding it until a first scan exists meant the one
            action the page is for vanished exactly when it was most needed. */}
        <Button href="/scan" variant="primary" size="md">
          Scan an app
        </Button>
      </header>

      {watched.length > 0 && (
        <div className="mt-12">
          <WatchedApps apps={watched} />
        </div>
      )}

      <section className="mt-12">
        {hasScans ? (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
            {apps.map((app) => {
              const { latest } = app;
              const ok = latest.verdict === "certified";
              return (
                <li key={app.appUrl}>
                  <Link
                    href={`/scan/${latest.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-hover/40"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {/* A standing state, not a per-scan event: the colour is
                          the fastest thing to read down a column. */}
                      <span
                        aria-hidden
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          latest.status !== "completed"
                            ? "bg-ash"
                            : ok
                              ? "bg-iris"
                              : "bg-oxblood",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-ivory">
                          {app.appUrl}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ash">
                          {relativeTime(latest.created_at)}
                          {latest.score !== null ? ` · score ${latest.score}` : ""}
                          {app.checks > 1 ? ` · ${app.checks} checks` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {/* Movement is the only thing a repeated check can tell
                          you that a single one can't — so it's what we show. */}
                      {app.scoreDelta !== null && app.scoreDelta !== 0 && (
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-[0.16em]",
                            app.scoreDelta > 0 ? "text-iris-soft" : "text-oxblood-soft",
                          )}
                        >
                          {app.scoreDelta > 0 ? "↑" : "↓"} {Math.abs(app.scoreDelta)}
                        </span>
                      )}
                      {latest.status === "completed" && latest.verdict ? (
                        <HallmarkStamp
                          state={ok ? "assayed" : "held"}
                          animate={false}
                          size="sm"
                        />
                      ) : (
                        <span className="rounded-pill border border-border bg-surface/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                          {latest.status}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Onboarding />
        )}
      </section>
    </div>
  );
}
