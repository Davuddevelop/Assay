import type { Metadata } from "next";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { startScan } from "@/app/(app)/scan/actions";

export const metadata: Metadata = {
  title: "Scan an app — Assay",
  description: "Check your app for security issues before you publish.",
  robots: { index: false, follow: true },
};

// A real scan (fetch app + crawl bundles + probe RLS/storage + Claude explain)
// can take longer than the platform's default function timeout; ask for headroom.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; prefill?: string }>;
}) {
  await requireUser();
  const { error, prefill } = await searchParams;

  // One step — paste a URL, scan runs immediately. No ownership tag: a scan only
  // reads what's already public, so there's nothing to "prove" to look at it.
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-20 sm:px-6">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-40" />
      <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
        Run an independent check.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Paste your live app link. Assay is the outside check — not the tool that
        built it — for the security holes AI-built apps ship with, and it tells
        you exactly how to fix each one.
      </p>

      <form action={startScan} className="mt-8">
        <div className="glass flex items-center gap-2 rounded-pill border border-border py-1.5 pl-5 pr-1.5">
          <input
            name="url"
            defaultValue={prefill ?? ""}
            inputMode="url"
            autoComplete="off"
            placeholder="yourapp.lovable.app"
            aria-label="Your app URL"
            className="min-w-0 flex-1 bg-transparent text-sm text-ivory outline-none placeholder:text-ash"
          />
          <SubmitButton variant="primary" size="sm" pendingText="Scanning…">
            Scan my app
          </SubmitButton>
        </div>
        {error === "url" && (
          <p className="mt-3 text-sm text-oxblood-soft">
            That doesn&rsquo;t look like a public app URL. Try the full link.
          </p>
        )}
        {error === "limit" && (
          <p className="mt-3 text-sm text-oxblood-soft">
            You&rsquo;ve used your scans for this month.{" "}
            <Link href="/pricing" className="text-iris-soft hover:text-ivory">
              Upgrade for more →
            </Link>
          </p>
        )}
        {error === "burst" && (
          <p className="mt-3 text-sm text-oxblood-soft">
            Slow down a sec — wait a minute and try again.
          </p>
        )}
      </form>

      <p className="mt-5 font-mono text-xs leading-relaxed text-ash">
        Read-only. We never store secrets and never change your app. By scanning,
        you confirm you own this app or are authorized to test it — see our{" "}
        <Link href="/acceptable-use" className="text-iris-soft hover:text-ivory">
          acceptable use
        </Link>{" "}
        policy.
      </p>

      <Link
        href="/sample"
        className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.14em] text-iris-soft hover:text-ivory"
      >
        See a sample report →
      </Link>
    </div>
  );
}
