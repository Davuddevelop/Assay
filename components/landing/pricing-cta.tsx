import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function PricingCta() {
  return (
    <section className="edge-b">
      <div className="mx-auto w-full max-w-4xl px-4 py-28 sm:px-6 xl:max-w-5xl xl:py-36">
        <Reveal>
          {/* The `.glow` behind this panel was a purple radial blur — the last
              surviving instance of the AI-gradient signature the rest of the
              site had already dropped. The closing argument doesn't need a lamp
              behind it; the panel's own light-catch hairline is the elevation. */}
          <div className="panel relative overflow-hidden px-6 py-20 text-center sm:px-16">
            <div className="relative flex flex-col items-center">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-ivory sm:text-5xl xl:text-6xl">
                Don&rsquo;t ship it on a hunch.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ivory-dim xl:max-w-lg xl:text-lg">
                Free to find out. Paste your app&rsquo;s link and get your first
                report — issues in plain language, with the exact fix — in about a
                minute.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/try" variant="primary" size="lg">
                  Scan my app
                </Button>
                <Button href="/sample" variant="ghost" size="lg">
                  See a sample report
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
