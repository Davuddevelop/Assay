import type { Metadata } from "next";
import Link from "next/link";

import { LiveScan } from "@/components/scan/live-scan";
import { Button } from "@/components/ui/button";
import { OwnershipCheck } from "@/components/scan/ownership-check";
import { LegalNotice } from "@/components/legal-notice";

export const metadata: Metadata = {
  alternates: { canonical: "/try" },
  title: "Free Vibe Coding Security Scanner — Assay",
  description:
    "Scan your Lovable, Bolt, Replit, or v0 app free, no login. Watch Assay check it live for exposed keys, an open database, and missing protections.",
};
export const dynamic = "force-dynamic";

function normalize(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default async function TryPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; owned?: string }>;
}) {
  const { url, owned } = await searchParams;
  const target = url ? normalize(url) : null;
  // The hero on the landing page posts straight here with a URL and nothing
  // else, so arriving with a target is not the same as having agreed to
  // anything. Confirm first, scan second.
  const confirmed = owned === "1";

  return (
    <main className="mx-auto w-full max-w-3xl xl:max-w-4xl px-4 py-16 sm:py-24">
      <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ivory">
        The independent check for your app.
      </h1>
      <p className="mt-3 text-ivory-dim">
        Paste your live app URL. Watch Assay tear through it for exposed keys, an open
        database, and missing protections — in plain English, no login.
      </p>

      {/* Two forms, one job, and which one you get depends on whether you
          arrived with a URL already. Typing one here and confirming it are the
          same step; arriving from the home page with a URL in the query string
          is not, so that case gets a confirmation panel instead of an
          immediate scan. */}
      {target && !confirmed ? (
        <form method="get" className="panel mt-8 p-5 sm:p-6">
          <input type="hidden" name="url" value={url ?? ""} />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
            About to check
          </p>
          <p className="mt-2 break-all font-mono text-sm text-ivory">{target}</p>

          <OwnershipCheck className="mt-6" />

          <Button type="submit" variant="primary" size="md" className="mt-6">
            Run the check
          </Button>

          <LegalNotice action="running a check" className="mt-5" />
        </form>
      ) : (
        <form method="get" className="mt-8">
          <input type="hidden" name="owned" value="1" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="url"
              defaultValue={url ?? ""}
              placeholder="yourapp.lovable.app"
              required
              className="flex-1 rounded-[var(--radius-control)] border border-line bg-surface px-5 py-3 font-mono text-sm text-ivory outline-none placeholder:text-ash focus:border-iris"
            />
            <Button type="submit" variant="primary" size="md">Scan my app</Button>
          </div>
          {/* Pre-ticked here and only here: submitting this form is the act of
              asking us to check a URL you just typed, and the panel above is
              the path for a URL that arrived from somewhere else. Leaving it
              blank would make the box a hurdle rather than a statement. */}
          <OwnershipCheck className="mt-5" defaultChecked />
        </form>
      )}

      {target && confirmed && <LiveScan key={target} target={target} />}

      {!target && (
        <>
          <LegalNotice action="running a check" className="mt-6" />
          <Link
            href="/sample"
            className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.14em] text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
          >
            See a sample report →
          </Link>
        </>
      )}
    </main>
  );
}
