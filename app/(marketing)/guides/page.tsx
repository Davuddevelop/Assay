import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  alternates: { canonical: "/guides" },
  title: "Security guides for apps built with AI",
  description:
    "Plain-English guides to the security problems that show up in apps built with Lovable, Bolt, Replit and v0 — what causes them, how to check your own app, and the exact fix.",
};

export default function GuidesIndexPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Guides" />
      <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.025em] text-ivory">
        Guides
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
        The problems we actually find, explained for someone who didn&rsquo;t
        write the code. Each one covers what causes it, how to check your own
        app in a couple of minutes, and the exact fix.
      </p>

      <ul className="mt-14 space-y-10">
        {GUIDES.map((g) => (
          <li key={g.slug} className="border-t border-line pt-8">
            <Link href={`/guides/${g.slug}`} className="group block">
              <h2 className="text-balance font-display text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-ivory transition-colors group-hover:text-ivory-dim">
                {g.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ivory-dim">
                {g.summary}
              </p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
                {g.minutes} min read
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
