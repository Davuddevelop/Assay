import type { Metadata } from "next";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { CopyButton } from "@/components/scan/copy-button";
import { requireUser } from "@/lib/auth";
import { ensureOwnershipToken } from "@/lib/data/scans";
import { startScan, confirmOwnership } from "@/app/(app)/scan/actions";

export const metadata: Metadata = {
  title: "Scan an app — Assay",
  description: "Check your app for security issues before you publish.",
};

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string;
    verify?: string;
    error?: string;
    failed?: string;
    prefill?: string;
  }>;
}) {
  const user = await requireUser();
  const { url, verify, error, failed, prefill } = await searchParams;

  // Step 2 — ownership verification.
  if (verify && url) {
    const token = await ensureOwnershipToken(user.id, url);
    const metaTag = `<meta name="assay-verify" content="${token}">`;
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
          Step 2 of 2 · Confirm it&rsquo;s yours
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">
          Prove you own this app
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
          We only scan apps you own. Add this tag to{" "}
          <span className="font-mono text-ivory">{url}</span>, republish, then verify.
          In Lovable/Bolt, just tell it: &ldquo;add this exact tag to the page head.&rdquo;
        </p>

        <div className="mt-6 rounded-[var(--radius-control)] border border-iris/30 bg-iris/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-iris-soft">
              Add to your page &lt;head&gt;
            </p>
            <CopyButton text={metaTag} label="Copy tag" />
          </div>
          <p className="mt-3 break-all font-mono text-sm text-ivory">{metaTag}</p>
        </div>

        {failed && (
          <p className="mt-5 rounded-[var(--radius-control)] border border-oxblood/50 bg-oxblood/10 px-4 py-3 text-sm text-oxblood-soft">
            We couldn&rsquo;t find the tag yet. Make sure you republished, then try again.
          </p>
        )}

        <form action={confirmOwnership} className="mt-6 flex items-center gap-3">
          <input type="hidden" name="url" value={url} />
          <SubmitButton variant="primary" size="lg" pendingText="Checking…">
            I&rsquo;ve added it — verify &amp; scan
          </SubmitButton>
          <Link
            href="/scan"
            className="font-mono text-xs uppercase tracking-[0.14em] text-ivory-dim hover:text-ivory"
          >
            ← Start over
          </Link>
        </form>
      </div>
    );
  }

  // Step 1 — submit the URL.
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-20 sm:px-6">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-40" />
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
        Step 1 of 2 · Your app
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
        Is your app safe to publish?
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Paste the link to your live app. Assay checks it for the security holes
        vibe-coded apps ship with — and tells you exactly how to fix each one.
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
          <SubmitButton variant="primary" size="sm" pendingText="Starting…">
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
      </form>

      <p className="mt-5 font-mono text-xs leading-relaxed text-ash">
        Assay only scans apps you own. We never store secrets and never change
        your app.
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
