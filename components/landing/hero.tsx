import { Button } from "@/components/ui/button";
import { ProductMock } from "@/components/landing/product-mock";
import { HallmarkSeal } from "@/components/hallmark-seal";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* engineering grid, faint */}
      <div aria-hidden className="bg-grid absolute inset-0 opacity-50" />
      {/* asymmetric light source — behind the card on the right */}
      <div
        aria-hidden
        className="glow absolute right-0 top-10 hidden h-96 w-[34rem] lg:block"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-28 lg:py-36">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Left — the words, left-aligned */}
          <Reveal className="lg:col-span-5">
            <h1 className="font-display text-[2.75rem] leading-[1.0] tracking-[-0.02em] text-ivory sm:text-6xl xl:text-7xl">
              Certified,
              <br />
              <span className="italic text-ivory-dim">not assumed.</span>
            </h1>

            <p className="mt-7 max-w-md text-base leading-relaxed text-ivory-dim sm:text-lg">
              An independent checkpoint for the code you ship with AI — for solo
              developers and vibe-coders. Assay runs your tests, a security scan,
              and a review against your own rules, then strikes the hallmark.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/login" variant="primary" size="lg">
                Connect a repo
              </Button>
              <Button href="/#how-it-works" variant="ghost" size="lg">
                See how it works
              </Button>
            </div>
          </Reveal>

          {/* Right — the product, off-grid, with the seal struck on its corner */}
          <div className="relative lg:col-span-7 lg:-mr-6 lg:translate-y-2 xl:-mr-12">
            {/* glow for mobile/tablet, where the side glow is hidden */}
            <div
              aria-hidden
              className="glow absolute -inset-x-8 -top-8 bottom-4 -z-10 lg:hidden"
            />
            <ProductMock className="lg:ml-auto lg:max-w-xl" />
            {/* a faint gold halo, ~10%, behind the hallmark only */}
            <div
              aria-hidden
              className="glow absolute -right-8 -top-14 h-44 w-44 opacity-40 lg:left-[-4.5rem] lg:right-auto lg:-top-20"
            />
            <HallmarkSeal className="absolute -right-3 -top-8 z-10 lg:left-[-3rem] lg:right-auto lg:-top-12" />
          </div>
        </div>
      </div>
    </section>
  );
}
