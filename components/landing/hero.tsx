import { Button } from "@/components/ui/button";
import { HallmarkMark } from "@/components/wordmark";
import { ProductMock } from "@/components/landing/product-mock";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* engineering grid + the warm glow, both faint */}
      <div aria-hidden className="bg-grid absolute inset-0 opacity-[0.5]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pb-28 sm:pt-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal className="flex flex-col items-center">
            <span className="mb-8 inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-line bg-obsidian-2/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ivory-dim">
              <HallmarkMark className="h-3.5 w-3.5 text-gold" />
              For solo developers and vibe-coders
            </span>

            <h1 className="font-display text-[2.75rem] leading-[1.0] tracking-[-0.02em] text-ivory sm:text-7xl">
              Certified,
              <br />
              <span className="italic text-ivory-dim">not assumed.</span>
            </h1>

            <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-ivory-dim sm:text-lg">
              An independent checkpoint for AI-written code. Assay runs your tests,
              a security scan, and a review against your own rules — then strikes
              the hallmark.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Button href="/login" variant="primary" size="lg">
                Connect a repo
              </Button>
              <Button href="/#how-it-works" variant="ghost" size="lg">
                See how it works
              </Button>
            </div>
          </Reveal>
        </div>

        {/* the product, struck — the hero's anchor */}
        <Reveal delay={140} className="relative mx-auto mt-20 max-w-3xl">
          <div
            aria-hidden
            className="glow absolute -inset-x-10 -top-10 bottom-8 -z-10"
          />
          <ProductMock />
        </Reveal>
      </div>
    </section>
  );
}
