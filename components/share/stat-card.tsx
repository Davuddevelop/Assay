import { Eyebrow } from "@/components/section-heading";
import { HallmarkMark } from "@/components/wordmark";

/**
 * A square stat card, sized for a LinkedIn/X image post and meant to be
 * screenshotted rather than shipped to a user.
 *
 * Everything is props — the numbers, the label, the findings, the footer — so
 * the next post is a data edit, not a new component. The route that renders it
 * also reads the same fields from the query string, so a one-off variant needs
 * no code change at all.
 *
 * Two design rules from CLAUDE.md §6 decide how this looks:
 *
 * - *One accent use per screen.* The accent is spent on the stat's numerator
 *   and nowhere else. The hallmark sits in ivory-dim like it does in the nav,
 *   the label and footer are ash. If a second thing were accented the number
 *   would stop reading as the point of the card.
 * - *No invented look.* The ground, grid, hairline, type roles and radii are
 *   the tokens already in globals.css. `.gold-metallic` is the existing
 *   struck-hallmark treatment (an iris gradient clipped to text) — the same
 *   one the wordmark uses, borrowed here for the one number that matters.
 *
 * Sizing is in px, deliberately, not Tailwind's rem scale. globals.css scales
 * the root font-size up at 1280px and 1680px viewports, which is right for the
 * app and wrong for an image: a card built in rem would render at a different
 * size depending on how wide the window happened to be when it was captured.
 * px makes the output identical at any viewport. The two arbitrary variants on
 * <Eyebrow> pin the one reused component to px for the same reason, rather
 * than duplicating its styles here.
 */

interface Finding {
  /** "Most common", "Second most common" — set in mono, above the text. */
  label: string;
  text: string;
}

interface StatCardProps {
  /** Small mono label at the top left, e.g. "First batch · week one". */
  label: string;
  /** The numerator — the one accented element on the card. */
  value: string;
  /** Optional denominator, rendered dimmer after a slash. */
  of?: string;
  /** The sentence the number completes. */
  headline: string;
  /** One line of context under the headline. */
  context: string;
  findings: Finding[];
  footer: string;
}

export function StatCard({
  label,
  value,
  of,
  headline,
  context,
  findings,
  footer,
}: StatCardProps) {
  return (
    <div className="relative flex h-[1200px] w-[1200px] shrink-0 flex-col overflow-hidden bg-onyx p-[100px]">
      {/* The graph-paper ground. An assay office measures things, and this is
          what measuring looks like — same utility the site's panels use. */}
      <div aria-hidden className="field pointer-events-none absolute inset-0" />

      <header className="relative flex items-start justify-between">
        <Eyebrow
          label={label}
          className="[&>span:first-child]:w-[28px] [&>span:last-child]:text-[15px]"
        />
        <HallmarkMark className="h-[52px] w-[52px] text-ivory-dim" />
      </header>

      {/* The hero owns the slack. Spreading all four blocks with
          justify-between gave four similar voids and read as undesigned;
          letting this one absorb the leftover height and centre inside it
          makes the number the reason the card exists, and lets the findings
          and footer close ranks into a single foot. */}
      <div className="relative flex flex-1 flex-col justify-center">
        {/* The denominator sits in ash, not ivory-dim. At this size a bright
            "/200" turns the whole line into one lit block and the accent stops
            reading as emphasis — the contrast between the two halves is what
            makes the number say "120 of them".

            The negative margin is optical alignment: display digits carry
            left side bearing, so the glyph starts inboard of the headline
            beneath it and the card's left edge reads as crooked. Measured
            off the rendered pixels, not the layout box — getBoundingClientRect
            includes the bearing, which is the very thing being corrected, so
            it reports the number as aligned when the ink is not. Real bearing
            at this size is ~2.5px; every other element inks at x=101. */}
        <p className="-ml-[3px] font-display text-[232px] font-semibold leading-[0.84] tracking-[-0.045em]">
          <span className="gold-metallic">{value}</span>
          {of && <span className="text-ash">/{of}</span>}
        </p>
        <p className="mt-[40px] max-w-[900px] font-display text-[48px] font-semibold leading-[1.12] tracking-[-0.028em] text-ivory">
          {headline}
        </p>
        {/* Narrower than the headline on purpose: at the headline's width this
            line broke with a single orphaned word, which reads as a mistake
            rather than as a measure. */}
        <p className="mt-[26px] max-w-[720px] text-[25px] leading-[1.5] text-ivory-dim">
          {context}
        </p>
      </div>

      <div className="relative">
        <div aria-hidden className="h-px w-full bg-line" />
        <ul className="mt-[44px] flex flex-col gap-[34px]">
          {findings.map((f) => (
            <li key={f.label}>
              <p className="font-mono text-[15px] uppercase tracking-[0.2em] text-ash">
                {f.label}
              </p>
              <p className="mt-[14px] font-display text-[34px] font-semibold tracking-[-0.02em] text-ivory">
                {f.text}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-[56px] font-mono text-[20px] tracking-[0.04em] text-ash">
          {footer}
        </p>
      </div>
    </div>
  );
}
