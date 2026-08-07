import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

/**
 * The argument, given a section of its own.
 *
 * Every scanner in this category — including the ones built into the platforms
 * themselves — competes on what it detects. Assay cannot win that fight and
 * shouldn't try: the competitors are better funded and already have longer
 * check lists. What none of them can have is the position, because a platform
 * checking its own output is structurally not an outside opinion, however good
 * its scanner is.
 *
 * So this section doesn't argue that our checks are better. It argues that the
 * check has to come from somewhere else, which is a claim only an independent
 * tool can make and the one thing a built-in scanner can never answer.
 *
 * Rule-divided columns rather than cards, matching HowItWorks — the page has a
 * system now and this belongs to it.
 */
const CASES = [
  {
    label: "Precious metal",
    body: "A silversmith doesn't stamp their own silver. It goes to an assay office, which has no stake in the sale, and only then does it get a hallmark.",
  },
  {
    label: "Electrical goods",
    body: "A manufacturer doesn't decide their own kettle is safe. UL tests it. That's why the mark on the plug means something to the person buying it.",
  },
  {
    label: "Food",
    body: "A kitchen doesn't award itself a hygiene rating. An inspector who doesn't work there does, and the rating goes in the window.",
  },
];

export function Independence() {
  return (
    <section className="edge-b">
      {/* One step taller than the sections below it, and the only one. The
          page's vertical rhythm came down across the board — every section was
          py-20 to py-36 around one short idea, which reads as empty rather
          than as confident — but the lead argument keeps its extra air so the
          page still has a first chapter instead of five equal blocks. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 xl:max-w-7xl xl:py-28">
        <Reveal>
          <Eyebrow label="Why independent" />
          <h2 className="mt-6 max-w-4xl text-balance font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem] xl:text-[3.3rem]">
            Every other scanner tells you what&rsquo;s broken. We&rsquo;re
            telling you why that check can&rsquo;t come from the platform, or
            from you.
          </h2>
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-ivory-dim sm:text-lg">
            <p>
              Lovable, Bolt, Replit and v0 all ship their own security checks
              now. They&rsquo;re not bad. They&rsquo;re just marking their own
              homework — the same system that made the decision is the one
              deciding whether the decision was safe, and it will grade
              generously, because everything it did looked correct to it at the
              time.
            </p>
            <p className="text-ivory">
              This is not a new problem, and every serious industry solved it
              the same way: the thing that makes it doesn&rsquo;t get to be the
              thing that certifies it.
            </p>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <ol className="mt-12 grid gap-y-10 md:grid-cols-3 md:gap-x-12">
            {CASES.map((c, i) => (
              <li
                key={c.label}
                className="border-t border-line pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0 md:first:border-l-0 md:first:pl-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-ash">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-ivory">
                    {c.label}
                  </h3>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory-dim">
                  {c.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-12 max-w-2xl border-l-2 border-border-strong pl-6 text-base leading-relaxed text-ivory sm:text-lg">
            Assay is that second opinion for software built with AI. We
            didn&rsquo;t write your code, we can&rsquo;t see it, and we have
            nothing to lose by telling you it&rsquo;s broken.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
