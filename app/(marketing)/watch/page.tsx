import type { Metadata } from "next";
import Link from "next/link";

import { MonitorView } from "@/components/monitor/monitor-view";
import { getDemoMonitor } from "@/lib/monitor/demo";

export const metadata: Metadata = {
  alternates: { canonical: "/watch" },
  title: "Continuous Security Monitoring for AI-Built Apps",
  description:
    "Assay keeps watching apps built with Lovable, Bolt, Replit, and v0, and catches the change that reopens a hole — before your users do.",
};

export default function WatchPage() {
  const { appUrl, scans, nextCheckHours } = getDemoMonitor();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">Example</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
        Assay never stops watching.
      </h1>
      <p className="mt-3 max-w-xl text-ivory-dim">
        A scan is a moment. Safety is a moving target — every prompt you ship can
        reopen a hole. Here&rsquo;s an example monitoring timeline: how Assay catches a
        change that breaks the app, then confirms the fix.
      </p>

      <div className="mt-10">
        <MonitorView appUrl={appUrl} scans={scans} nextCheckHours={nextCheckHours} />
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/try"
          className="rounded-[var(--radius-control)] bg-ivory px-5 py-2.5 text-sm font-semibold text-onyx transition-opacity hover:opacity-90"
        >
          Scan your app
        </Link>
        <Link
          href="/sample"
          className="font-mono text-xs uppercase tracking-[0.14em] text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
        >
          See a sample report →
        </Link>
      </div>
    </main>
  );
}
