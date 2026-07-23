import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScanReport } from "@/components/scan/scan-report";
import { ScanPoller } from "@/components/scan/scan-poller";
import { WatchToggle } from "@/components/scan/watch-toggle";
import { BadgeShare } from "@/components/scan/badge-share";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { getScan, getScanFindings } from "@/lib/data/scans";
import { isWatched } from "@/lib/data/monitors";

export const metadata: Metadata = {
  title: "Scan report — Assay",
  description: "Your app's security scan results.",
  robots: { index: false, follow: true },
};

export default async function ScanReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) notFound();

  const running = scan.status === "queued" || scan.status === "running";

  if (running) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 text-center">
        <ScanPoller active />
        <Spinner className="h-8 w-8 text-iris-soft" />
        <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Scanning your app…
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory-dim">
          Checking <span className="font-mono text-ivory">{scan.app_url}</span> for
          exposed secrets, database exposure, and more. This usually takes under a
          minute.
        </p>
      </div>
    );
  }

  if (scan.status === "error") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-ivory">
          We couldn&rsquo;t finish that scan.
        </h1>
        <p className="mt-3 text-sm text-ivory-dim">
          {scan.error ?? "Something went wrong reaching your app."}
        </p>
        <Button href="/scan" variant="primary" size="md" className="mt-8">
          Try another scan
        </Button>
      </div>
    );
  }

  const [findings, watched] = await Promise.all([
    getScanFindings(id),
    isWatched(scan.app_url),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Dashboard
      </Link>
      <div className="mt-6">
        <ScanReport scan={scan} findings={findings} />
      </div>
      <div className="mt-8">
        <WatchToggle scan={scan} watched={watched} />
      </div>
      {scan.verdict === "certified" && (
        <div className="mt-4">
          <BadgeShare scanId={scan.id} />
        </div>
      )}
      <div className="mt-8 flex justify-center">
        <Button href="/scan" variant="ghost" size="md">
          Scan another app
        </Button>
      </div>
    </div>
  );
}
