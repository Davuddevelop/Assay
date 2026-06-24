import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export function HallmarkApplied() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow index="03" label="The hallmark, applied" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl leading-[1.1] text-ivory sm:text-[2.6rem]">
            The same change, judged two ways.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-dim">
            A mark you can trust because it says what was checked and what was
            found — not a green light that means nothing.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* Assayed */}
          <Reveal>
            <article className="h-full rounded-[var(--radius-card)] border border-line bg-obsidian-2 p-8 transition-colors duration-300 hover:border-gold/40">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="assayed" />
                <span className="font-mono text-xs text-ash">checks/8f21a</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                Add idempotency key to checkout
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                42 tests passed. No unsafe patterns found. All three of your rules
                held. The change is sound.
              </p>
            </article>
          </Reveal>

          {/* Held */}
          <Reveal delay={110}>
            <article className="h-full rounded-[var(--radius-card)] border border-oxblood/50 bg-obsidian-2 p-8">
              <div className="flex items-center justify-between">
                <HallmarkStamp state="held" />
                <span className="font-mono text-xs text-ash">checks/8f21b</span>
              </div>
              <h3 className="mt-6 text-lg font-medium text-ivory">
                Add request logging to payments
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                Breaks your rule:{" "}
                <span className="text-ivory">never log card data</span>. The new
                logger writes the full request body, including the card number.
              </p>

              <figure className="mt-5 overflow-hidden rounded-[var(--radius-control)] border border-line bg-obsidian">
                <figcaption className="border-b border-line px-4 py-2 font-mono text-xs text-ash">
                  payments/charge.ts:48
                </figcaption>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-ivory-dim">
                  <code>{`logger.info("charge", { body: req.body });
//                          ^ includes card.number`}</code>
                </pre>
              </figure>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
