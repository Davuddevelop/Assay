import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Onboarding } from "@/components/onboarding";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import { WatchedApps } from "@/components/dashboard/watched-apps";
import { requireUser, toSessionUser } from "@/lib/auth";
import { listScans } from "@/lib/data/scans";
import { listWatchedApps } from "@/lib/data/monitors";
import { relativeTime } from "@/lib/data/derive";

export const metadata: Metadata = {
  title: "Dashboard — Assay",
  description: "Your app security scans.",
  robots: { index: false, follow: true },
};

export default async function DashboardPage() {
  const session = toSessionUser(await requireUser());
  const [scans, watched] = await Promise.all([listScans(), listWatchedApps()]);
  const hasScans = scans.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-40" />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            {session.name}&rsquo;s workspace
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
            {hasScans ? "Your scans" : "Nothing scanned yet."}
          </h1>
        </div>
        {hasScans && (
          <Button href="/scan" variant="primary" size="md">
            Scan an app
          </Button>
        )}
      </header>

      {watched.length > 0 && (
        <div className="mt-12">
          <WatchedApps apps={watched} />
        </div>
      )}

      <section className="mt-12">
        {hasScans ? (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
            {scans.map((scan) => (
              <li key={scan.id}>
                <Link
                  href={`/scan/${scan.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-hover/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-ivory">{scan.app_url}</p>
                    <p className="mt-1 font-mono text-xs text-ash">
                      {relativeTime(scan.created_at)}
                      {scan.score !== null ? ` · score ${scan.score}` : ""}
                    </p>
                  </div>
                  {scan.status === "completed" && scan.verdict ? (
                    <HallmarkStamp
                      state={scan.verdict === "certified" ? "assayed" : "held"}
                      animate={false}
                      size="sm"
                    />
                  ) : (
                    <span className="rounded-pill border border-border bg-surface/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                      {scan.status}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Onboarding />
        )}
      </section>
    </div>
  );
}
