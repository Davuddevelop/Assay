import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function PricingCta() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-4xl px-4 py-28 sm:px-6">
        <Reveal>
          <div className="panel relative overflow-hidden px-6 py-20 text-center sm:px-16">
            <div
              aria-hidden
              className="glow absolute inset-x-0 -top-24 mx-auto h-64 max-w-md"
            />
            <div className="relative flex flex-col items-center">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] text-ivory sm:text-5xl">
                Is your app safe to{" "}
                <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
                  publish
                </span>
                ?
              </h2>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ivory-dim">
                Free to find out. Paste your app&rsquo;s link and get your first
                report — issues in plain language, with the exact fix — in about a
                minute.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/scan" variant="primary" size="lg">
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
