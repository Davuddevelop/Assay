import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppAgent } from "@/components/monitor/app-agent";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import { requireUser } from "@/lib/auth";
import { getMonitor } from "@/lib/data/monitors";
import { listCompletedScansForUrl } from "@/lib/data/scans";
import { buildActivity } from "@/lib/monitor/activity";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your app's agent — Assay",
  description: "Every check Assay ran on this app, and a direct line to ask about it.",
};

/**
 * Each watched app gets its own agent page: the re-check history as a chat
 * thread from Assay, plus a composer to talk back — grounded in this app's
 * real scan data. This is the continuous-relationship surface, one per app.
 */
export default async function AppAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const monitor = await getMonitor(id);
  if (!monitor) notFound();

  const scans = await listCompletedScansForUrl(monitor.app_url);
  const history = scans.map((s) => ({
    id: s.id,
    at: s.completed_at ?? s.created_at,
    score: s.score,
    verdict: s.verdict,
  }));
  const events = buildActivity(history).reverse(); // chat reads oldest → newest
  const latest = scans[scans.length - 1];
  const certified = latest?.verdict === "certified";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Dashboard
      </Link>

      {/* status header */}
      <header className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-soft opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-iris" />
            </span>
            {monitor.active ? "Watching" : "Watch paused"}
          </p>
          <h1 className="mt-2 truncate font-display text-2xl font-bold tracking-[-0.02em] text-ivory sm:text-3xl">
            {monitor.app_url.replace(/^https?:\/\//, "")}
          </h1>
        </div>
        {latest && (
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-display text-4xl font-bold tabular-nums",
                  certified ? "text-iris-soft" : "text-oxblood-soft",
                )}
              >
                {latest.score ?? "—"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">/ 100</span>
            </div>
            <HallmarkStamp state={certified ? "assayed" : "held"} animate={false} size="sm" />
          </div>
        )}
      </header>

      {latest && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
          Last full check {new Date(latest.completed_at ?? latest.created_at).toLocaleDateString()} ·{" "}
          <Link href={`/scan/${latest.id}`} className="text-iris-soft transition-colors hover:text-ivory">
            open the full report →
          </Link>
        </p>
      )}

      <div className="mt-8">
        <AppAgent monitorId={monitor.id} appUrl={monitor.app_url} events={events} />
      </div>
    </div>
  );
}
