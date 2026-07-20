import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Button } from "@/components/ui/button";
import { getBadgeReport } from "@/lib/data/scans";
import { verificationFreshness, VALID_DAYS } from "@/lib/scan/freshness";
import { cn } from "@/lib/utils";

// Public, read-by-token — always fresh, never cached to a stale verdict.
export const dynamic = "force-dynamic";

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await getBadgeReport(token);
  if (!report) return { title: "Assay" };
  const host = hostOf(report.appUrl);
  return {
    title: `${host} — Certified safe to publish · Assay`,
    description: `${host} passed Assay's independent security check.`,
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

  const certified = report.verdict === "certified";
  const host = hostOf(report.appUrl);
  const fresh = verificationFreshness(report.completedAt);
  const expired = fresh.state === "expired";

  const tone =
    expired || !certified
      ? { text: "text-oxblood-soft", dot: "bg-oxblood" }
      : fresh.state === "aging"
        ? { text: "text-ivory", dot: "bg-ivory-dim" }
        : { text: "text-iris-soft", dot: "bg-iris" };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 sm:py-24">
      <div className="panel overflow-hidden p-8 text-center sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
          Independent security check
        </p>
        <p className="mt-3 truncate font-mono text-sm text-ivory">{host}</p>

        <div className="mt-8 flex justify-center">
          <HallmarkStamp state={certified && !expired ? "assayed" : "held"} animate={false} />
        </div>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
          {!certified
            ? "Not certified."
            : expired
              ? "Certification expired."
              : "Certified safe to publish."}
        </h1>

        <p
          className={cn(
            "mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]",
            tone.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
          {fresh.label}
        </p>

        {report.score !== null && (
          <div className="mt-6 flex items-baseline justify-center gap-2">
            <span
              className={cn(
                "font-display text-4xl font-bold tabular-nums",
                certified && !expired ? "text-iris-soft" : "text-oxblood-soft",
              )}
            >
              {report.score}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
              / 100 safety score
            </span>
          </div>
        )}

        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ivory-dim">
          {expired
            ? `This app passed Assay's check, but the verification is older than ${VALID_DAYS} days. Apps drift as they're edited — ask the owner for a fresh check.`
            : certified
              ? `Assay checked ${host} for exposed secrets, open databases, and missing protections and found nothing that puts users at risk.`
              : `This app has open security issues its owner needs to fix before it's safe to publish.`}
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-ivory-dim">Is your app safe to publish?</p>
        <Button href="/" variant="primary" size="md" className="mt-4">
          Scan yours free
        </Button>
      </div>
    </div>
  );
}
