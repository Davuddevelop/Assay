import Link from "next/link";

import { otherGuides } from "@/lib/guides";

/**
 * The foot of every guide: what to read next, and one honest offer.
 *
 * Deliberately the same on all of them. A guide that ends by selling harder
 * than it taught is the kind of page people stop trusting, so the pitch is one
 * sentence and it only claims what the scanner actually does.
 */
export function GuideFooter({ slug }: { slug: string }) {
  const more = otherGuides(slug);

  return (
    <div className="mt-16 border-t border-line pt-10">
      <p className="text-base leading-relaxed text-ivory-dim">
        Assay checks for this automatically, from outside your app, with no
        login and no access to your code — and tells you in plain English what
        it found, with the fix attached.{" "}
        <Link
          href="/about"
          className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
        >
          What it doesn&rsquo;t check is written down too.
        </Link>
      </p>
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-ivory-dim">
        <Link href="/try" className="transition-colors hover:text-ivory">
          Check your app &rarr;
        </Link>
      </p>

      {more.length > 0 && (
        <div className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            Read next
          </p>
          <ul className="mt-5 space-y-4">
            {more.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group block border-t border-line pt-4"
                >
                  <span className="font-display text-lg font-bold tracking-[-0.015em] text-ivory transition-colors group-hover:text-ivory-dim">
                    {g.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ivory-dim">
                    {g.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
