import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Silk } from "@/components/landing/silk";

export function PricingCta() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-4xl px-4 py-28 sm:px-6">
        <Reveal>
          <div className="panel relative overflow-hidden px-6 py-24 text-center sm:px-16">
            {/* Silk reprise — the page bookends on flowing fabric. Masked to a
                soft center and veiled so the closing headline stays crisp. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_120%_at_50%_40%,#000_35%,transparent_82%)]"
            >
              <Silk className="absolute inset-0 h-full w-full opacity-50" />
              <div className="absolute inset-0 bg-onyx/55" />
            </div>
            <div
              aria-hidden
              className="glow absolute inset-x-0 -top-24 mx-auto h-64 max-w-md"
            />
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-ivory sm:text-5xl">
                Don&rsquo;t ship it on a{" "}
                <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
                  hunch
                </span>
                .
              </h2>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ivory-dim">
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
