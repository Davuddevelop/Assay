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
                Strike your first hallmark.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ivory-dim">
                Free for solo work. Connect a repository and see the next change
                assayed — it takes about a minute to set up.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href="/login" variant="primary" size="lg">
                  Connect a repo
                </Button>
                <Button href="/pricing" variant="ghost" size="lg">
                  See pricing
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
