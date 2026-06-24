import { Button } from "@/components/ui/button";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import { HallmarkMark } from "@/components/wordmark";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <HallmarkMark className="mb-8 h-12 w-12 text-gold" />

        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ivory sm:text-6xl">
          Certified, not assumed.
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-ivory-dim sm:text-lg">
          An independent checkpoint for AI-written code. Assay runs your tests, a
          security scan, and a review against your own rules — then strikes the
          hallmark.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button href="/login" variant="primary" size="lg">
            Connect a repo
          </Button>
          <Button href="/#how-it-works" variant="ghost" size="lg">
            See how it works
          </Button>
        </div>

        <div className="mt-14 flex items-center gap-3">
          <HallmarkStamp state="assayed" />
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-ash">
            on every change
          </span>
        </div>
      </div>
    </section>
  );
}
