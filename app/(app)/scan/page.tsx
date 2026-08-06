import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { SubmitButton } from "@/components/ui/submit-button";
import { ScanErrorToast } from "@/components/scan/scan-error-toast";
import { OwnershipCheck } from "@/components/scan/ownership-check";
import { requireUser } from "@/lib/auth";
import { PREFILL_COOKIE } from "@/lib/scan/prefill";
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
  // Set when they came here from an anonymous report; it expires on its own, so
  // a stale one is a filled box they can overwrite, never a wrong scan.
  const carried = prefill ?? (await cookies()).get(PREFILL_COOKIE)?.value ?? "";

  // Paste a URL, tick that it's yours, scan runs. The tick is not verification
  // — a meta-tag check is still unbuilt (CLAUDE.md §5, §12) — but it moves the
  // ownership claim from something we asserted on the user's behalf in a
  // footnote to something they actually stated.
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-20 sm:px-6">
      <ScanErrorToast error={error} />
      <div aria-hidden className="field pointer-events-none absolute inset-x-0 top-0 -z-10 h-72" />
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
            defaultValue={carried}
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
            <Link href="/billing" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
              Upgrade for more →
            </Link>
          </p>
        )}
        {error === "burst" && (
          <p className="mt-3 text-sm text-oxblood-soft">
            Slow down a sec — wait a minute and try again.
          </p>
        )}
        {error === "owned" && (
          <p className="mt-3 text-sm text-oxblood-soft">
            Tick the box to confirm this is your app. Assay only checks apps you
            own or are authorised to test.
          </p>
        )}

        <OwnershipCheck className="mt-6" />
      </form>

      <p className="mt-5 font-mono text-xs leading-relaxed text-ash">
        Read-only. We never store secrets and never change your app.
      </p>

      <Link
        href="/sample"
        className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.14em] text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
      >
        See a sample report →
      </Link>
    </div>
  );
}
