import { Button } from "@/components/ui/button";

export function PricingCta() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-3xl px-4 py-28 text-center sm:px-6">
        <h2 className="font-display text-3xl leading-tight text-ivory sm:text-4xl">
          Strike your first hallmark.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ivory-dim">
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
    </section>
  );
}
