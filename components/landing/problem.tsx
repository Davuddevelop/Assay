import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ScanCard } from "@/components/landing/scan-card";

export function Problem() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Eyebrow label="The problem" />
          <h2 className="mt-6 font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            AI writes code that{" "}
            <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
              looks
            </span>{" "}
            right.
          </h2>
          <div className="mt-7 space-y-4 text-base leading-relaxed text-ivory-dim sm:text-lg">
            <p>
              It reads cleanly. It compiles. The diff looks reasonable — so it
              ships. Then it logs a card number, skips the edge case your tests
              cover, or quietly breaks the thing two files over.
            </p>
            <p>
              Looking right isn&rsquo;t being right. You need an independent check
              that doesn&rsquo;t trust the code just because it reads well.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ScanCard />
        </Reveal>
      </div>
    </section>
  );
}
