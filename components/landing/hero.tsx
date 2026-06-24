import { Button } from "@/components/ui/button";
import { HallmarkStamp } from "@/components/hallmark-stamp";
import { HallmarkMark } from "@/components/wordmark";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* hairline frame echoing the grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-6xl -translate-x-1/2 border-x border-line/60 lg:block"
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-28 text-center sm:px-6 sm:py-36">
        <Reveal className="flex flex-col items-center">
          <span className="mb-8 inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-line bg-obsidian-2/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ivory-dim">
            <HallmarkMark className="h-3.5 w-3.5 text-gold" />
            For solo developers and vibe-coders
          </span>

          <h1 className="font-display text-5xl leading-[1.02] tracking-[-0.02em] text-ivory sm:text-7xl">
            Certified,
            <br />
            <span className="italic text-ivory-dim">not assumed.</span>
          </h1>

          <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-ivory-dim sm:text-lg">
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
        </Reveal>

        <Reveal
          delay={120}
          className="mt-16 flex items-center gap-3 border-t border-line/70 pt-8"
        >
          <HallmarkStamp state="assayed" />
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            struck on every change
          </span>
        </Reveal>
      </div>
    </section>
  );
}
