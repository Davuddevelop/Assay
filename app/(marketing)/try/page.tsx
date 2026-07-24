import type { Metadata } from "next";
import Link from "next/link";

import { LiveScan } from "@/components/scan/live-scan";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
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
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const target = url ? normalize(url) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ivory">
        The independent check for your app.
      </h1>
      <p className="mt-3 text-ivory-dim">
        Paste your live app URL. Watch Assay tear through it for exposed keys, an open
        database, and missing protections — in plain English, no login.
      </p>

      <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="url"
          defaultValue={url ?? ""}
          placeholder="yourapp.lovable.app"
          required
          className="flex-1 rounded-pill border border-line bg-surface px-5 py-3 font-mono text-sm text-ivory outline-none placeholder:text-ash focus:border-iris"
        />
        <Button type="submit" variant="primary" size="md">Scan my app</Button>
      </form>

      {target && <LiveScan key={target} target={target} />}

      {!target && (
        <Link
          href="/sample"
          className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.14em] text-iris-soft hover:text-ivory"
        >
          See a sample report →
        </Link>
      )}
    </main>
  );
}
