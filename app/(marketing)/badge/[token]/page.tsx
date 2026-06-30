import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScanReport } from "@/components/scan/scan-report";
import { Button } from "@/components/ui/button";
import { getBadgeReport } from "@/lib/data/scans";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await getBadgeReport(token);
  if (!report) return { title: "Report not found — Assay" };
  return {
    title: `${report.scan.app_url} — Assayed safe to publish`,
    description: `An independent Assay security report for ${report.scan.app_url}.`,
  };
}

export default async function BadgePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getBadgeReport(token);
  if (!report) notFound();

  const { scan, findings } = report;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
        Public hallmark
      </p>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-ivory-dim">
        An independent Assay security report, published by the app&rsquo;s owner.
        Assay scans only apps the owner verifies they control.
      </p>

      <div className="mt-8">
        <ScanReport scan={scan} findings={findings} />
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-ivory-dim">
          Built an app with Lovable, Bolt, Replit, or v0?
        </p>
        <Button href="/scan" variant="primary" size="lg">
          Check if yours is safe to publish
        </Button>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
        >
          What is Assay?
        </Link>
      </div>
    </div>
  );
}
