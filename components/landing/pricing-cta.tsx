import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

/**
 * The closing ask.
 *
 * It was a rounded panel, centred, floating in the middle of the page with
 * generous margins all round — the shape every template uses for a final CTA,
 * and the last block on this page still wearing one. Two things were wrong
 * with it beyond familiarity: it was the only centred text on a page that is
 * otherwise left-aligned to a single edge, and a card at the end of a scroll
 * reads as a footer advert rather than as the page arriving somewhere.
 *
 * Now it is the page ground with a rule above it, on the same left edge as
 * every headline above, and it holds the largest type on the page after the
 * hero. The emphasis comes from scale and position, which is what the rest of
 * this design does, rather than from a container.
 */
export function PricingCta() {
  return (
    <section className="edge-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 xl:max-w-7xl xl:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <h2 className="text-balance font-display text-3xl font-semibold leading-[1.02] tracking-[-0.03em] text-ivory sm:text-5xl xl:text-6xl">
              Don&rsquo;t ship it on a hunch.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ivory-dim xl:text-lg">
              Free to find out. Paste your link and get the first report in
              about a minute.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/try" variant="primary" size="lg">
                Scan my app
              </Button>
              <Button href="/sample" variant="ghost" size="lg">
                See a sample report
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
