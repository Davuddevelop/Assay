import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export function Problem() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-3xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="The problem" />
          <h2 className="mt-6 font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            AI writes code that <span className="text-ivory-dim">looks</span> right.
          </h2>
          <div className="mt-7 space-y-4 text-base leading-relaxed text-ivory-dim sm:text-lg">
            <p>
              The generated function reads cleanly. It compiles. The diff looks
              reasonable. So it ships — and then it logs a card number, skips the
              edge case your tests cover, or quietly breaks the thing two files
              over.
            </p>
            <p>
              Looking right is not the same as being right. What you need is an
              independent check that doesn&rsquo;t trust the code just because it
              reads well — one that runs your tests, scans for what&rsquo;s
              unsafe, and holds the change against the rules you set.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
