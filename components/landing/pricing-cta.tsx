import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";

export function PricingCta() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-3xl px-4 py-32 text-center sm:px-6">
        <Reveal className="flex flex-col items-center">
          <h2 className="font-display text-4xl leading-[1.05] text-ivory sm:text-5xl">
            Strike your first <span className="italic">hallmark</span>.
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
        </Reveal>
      </div>
    </section>
  );
}
