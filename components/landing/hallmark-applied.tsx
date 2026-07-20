import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { SpotlightCard } from "@/components/spotlight-card";

export function HallmarkApplied() {
  return (
    <section className="edge-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="The hallmark, applied" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            Two apps, judged{" "}
            <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
              two ways
            </span>
            .
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-dim">
            A mark you can trust because it says exactly what was checked and what
            was found — not a green light that means nothing.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* Assayed */}
          <Reveal>
            <SpotlightCard className="panel lift-glow h-full p-8">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="assayed" />
                <span className="font-mono text-xs text-ash">my-saas.lovable.app</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                Safe to publish
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                No secret keys in the browser. Database locked down — rows are
                protected. Security headers in place. This app earned the hallmark.
              </p>
            </SpotlightCard>
          </Reveal>

          {/* Held */}
          <Reveal delay={110}>
            <SpotlightCard className="lift h-full rounded-[var(--radius-card)] border border-oxblood/50 bg-surface p-8">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="held" />
                <span className="font-mono text-xs text-ash">my-store.lovable.app</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                Not safe to publish — yet
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
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
