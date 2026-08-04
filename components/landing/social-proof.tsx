import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { countCompletedScans } from "@/lib/data/scan-stats";

/**
 * Proof — real, or absent. There is no third state.
 *
 * The whole product is an argument about not taking the maker's word for it.
 * A landing page carrying an invented testimonial or a flattering round number
 * would be exactly the thing we're selling against, and anyone who noticed
 * would be right to stop reading. So this section shows what is true and
 * renders nothing at all when nothing is.
 *
 * Populating QUOTES is a one-line edit when a real quote arrives. Do not add
 * one that hasn't been said by a real person who agreed to be named.
 */
type Quote = {
  quote: string;
  name: string;
  role: string;
};

const QUOTES: Quote[] = [];

/**
 * Below this, the counter stays hidden.
 *
 * A number is not automatically persuasive for being true. "26 scans run"
 * argues against us more effectively than saying nothing, so there is a floor,
 * and it lives here as a named constant rather than buried in a condition —
 * raising it should be a visible decision someone makes on purpose.
 */
const MIN_SCANS_TO_SHOW = 250;

export async function SocialProof() {
  const scans = await countCompletedScans();
  const showCount = scans !== null && scans >= MIN_SCANS_TO_SHOW;
  const showQuotes = QUOTES.length > 0;

  // Nothing true to say yet — render nothing, not an empty frame.
  if (!showCount && !showQuotes) return null;

  return (
    <section className="edge-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 xl:max-w-7xl xl:py-24">
        <Reveal>
          <Eyebrow label="So far" />
        </Reveal>

        {showCount && (
          <Reveal>
            <div className="mt-6 flex items-baseline gap-4">
              <CountUp
                to={scans}
                className="font-display text-5xl font-bold tabular-nums text-ivory sm:text-6xl"
              />
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
                {/* "Scans run" and nothing more. It counts scans; it does not
                    count customers, and the table it comes from cannot tell
                    the difference between a stranger and our own testing. */}
                scans run
              </span>
            </div>
          </Reveal>
        )}

        {showQuotes && (
          <Reveal delay={90}>
            <ul className="mt-14 grid gap-y-10 md:grid-cols-3 md:gap-x-12">
              {QUOTES.map((q) => (
                <li
                  key={q.name}
                  className="border-t border-line pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0 md:first:border-l-0 md:first:pl-0"
                >
                  <blockquote className="text-base leading-relaxed text-ivory">
                    &ldquo;{q.quote}&rdquo;
                  </blockquote>
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-ash">
                    {q.name} · {q.role}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}
