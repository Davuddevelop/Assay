import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Button } from "@/components/ui/button";
import { getBadgeReport } from "@/lib/data/scans";
import { verificationFreshness, VALID_DAYS } from "@/lib/scan/freshness";
import { formatReportDate } from "@/lib/data/derive";
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
  const title = `${host} — checked by Assay`;
  const description = `${host} passed Assay's independent security check — no issues found in the checks Assay runs.`;
  return {
    title,
    description,
    // Self-canonical. These are the pages people share and embed, so they are
    // the most likely to be reached by a link carrying tracking parameters —
    // this keeps every variant consolidated onto one URL.
    alternates: { canonical: `/badge/${token}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
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
  const struckOn = formatReportDate(report.struckAt);
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

        {/* Standing, not a souvenir. This page resolves the latest check, so
            an app that regressed after the mark was struck says so here —
            without anyone having to update anything. */}
        <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
          {!certified
            ? "This mark is no longer valid."
            : expired
              ? "This check has expired."
              : "No issues found."}
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
                certified && !expired ? "text-ivory" : "text-oxblood-soft",
              )}
            >
              {report.score}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
              / 100 safety score
            </span>
          </div>
        )}

        {/* Deliberately vague on failure. Naming what is wrong with a live app
            on a public URL hands an attacker a map, so this says only that the
            mark no longer stands. The owner sees the detail when they sign in;
            nobody else ever does. */}
        <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ivory-dim">
          {expired
            ? `This app passed Assay's check, but the verification is older than ${VALID_DAYS} days. Apps drift as they're edited — ask the owner for a fresh check.`
            : certified
              ? `Assay checked ${host} for exposed secrets, open databases, and missing protections, and found no evidence of those specific issues at the last check.`
              : `A later check found this app no longer meets the standard it was marked for. The details go to the owner, not here. Ask them for a current report.`}
        </p>

        {/* What re-verification actually means for this app. Claiming continuous
            checking on an app nothing is re-checking would be the exact kind of
            overclaim the mark exists to prevent. */}
        <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-ash">
          {report.watched
            ? "This mark re-verifies itself. Assay re-checks this app automatically, and this page updates on its own — including revoking the mark if the app stops passing. Neither the owner nor Assay can hold it open."
            : "This is a point-in-time check. This app isn't on continuous monitoring, so this page reflects the last check that was run, not today."}
          {struckOn && ` Mark first struck ${struckOn}.`}
        </p>

        <p className="mx-auto mt-5 max-w-sm border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ash">
          A bounded, automated check for specific issues — not a comprehensive
          audit, and not a guarantee this app is secure. Provided for
          informational use only; see{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ivory-dim">
            Terms
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-ivory-dim">Is your app safe to publish?</p>
        <Button href="/try" variant="primary" size="md" className="mt-4">
          Scan yours free
        </Button>
      </div>
    </div>
  );
}
