import Link from "next/link";

import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export function HallmarkApplied() {
  return (
    <section className="edge-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 xl:max-w-7xl xl:py-24">
        <Reveal>
          <Eyebrow label="The hallmark, applied" />
          <h2 className="mt-5 max-w-3xl text-balance font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ivory sm:text-[2rem] xl:text-[2.4rem]">
            Two apps, judged two ways.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-dim xl:text-lg">
            A mark you can trust because it says exactly what was checked and what
            was found — not a green light that means nothing.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Assayed */}
          <Reveal>
            {/* Border-only hover. These two cards previously carried a cursor-following
                spotlight AND a glow lift — two effects doing the same job on the
                same element. */}
            <div className="panel lift h-full p-8">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="assayed" />
                <span className="font-mono text-xs text-ash">my-saas.lovable.app</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                No issues found
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                No secret keys in the browser. Database locked down — rows are
                protected. Security headers in place. This app earned the hallmark.
              </p>
            </div>
          </Reveal>

          {/* Held */}
          <Reveal delay={110}>
            <div className="lift h-full rounded-[var(--radius-card)] border border-oxblood/50 bg-surface p-8">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="held" />
                <span className="font-mono text-xs text-ash">my-store.lovable.app</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                Issues found
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                Critical:{" "}
                <span className="text-ivory">your database is open to the public</span>.
                Anyone can read every customer&rsquo;s name, email, and order.
              </p>

              <figure className="mt-5 overflow-hidden rounded-[var(--radius-control)] border border-line bg-onyx">
                <figcaption className="border-b border-line px-4 py-2 font-mono text-xs text-ash">
                  the fix — paste into Lovable
                </figcaption>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-ivory-dim">
                  <code>{`Turn on row-level security for the
profiles and orders tables, and add
a policy so users see only their own
rows.`}</code>
                </pre>
              </figure>
            </div>
          </Reveal>
        </div>

        {/* The one fork on the page, and it belongs here.
            Everything above this speaks to someone checking their own app.
            The mark is the first thing that only makes sense when there is a
            second person in the room — you don't hand yourself evidence. So
            this is the natural point to name the buyer the strategy actually
            rests on (CLAUDE.md §10: the client-handoff moment), and it was
            previously unnamed anywhere on the home page. A freelancer landing
            here had no signal the product was written for them. */}
        <Reveal delay={160}>
          <div className="mt-12 border-t border-line pt-8">
            <h3 className="max-w-2xl text-balance font-display text-xl font-semibold tracking-[-0.015em] text-ivory">
              If you built it for someone else, the mark is the point.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-dim">
              &ldquo;Yes, I checked it&rdquo; is the builder vouching for their
              own build, and the client knows it. A dated report and a mark that
              re-checks itself is the version they can verify without trusting
              you &mdash; which is what makes it worth attaching to an invoice.
            </p>
            <Link
              href="/client-handoff"
              className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.14em] text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
            >
              What to hand over &rarr;
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
