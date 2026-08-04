import { SubmitButton } from "@/components/ui/submit-button";
import { VALID_DAYS } from "@/lib/scan/freshness";
import { continueWithApp } from "@/app/(marketing)/try/actions";

/**
 * What to do now — the end of an anonymous report.
 *
 * The report used to simply stop. Someone pasted a URL, watched the scan, read
 * every finding with its exact fix, and hit the bottom of the page with nothing
 * asked of them. The free report answered the question so completely that it
 * also ended the relationship.
 *
 * The fix is not to take the findings away. Giving away the diagnosis is the
 * whole reason anyone tries this, and gating it would trade the top of the
 * funnel for nothing. What is actually scarce is the part they cannot produce
 * themselves: noticing the day it breaks again.
 *
 * This used to lead with the badge. A displayable mark is the right long-term
 * asset, but a badge from a company nobody has heard of adds no credibility to
 * anyone's landing page, so it was asking people to work for something worth
 * nothing yet. The alert is worth something on day one — it is the only thing
 * here that a person cannot do for themselves, at any price, by being careful.
 * So the ask is now: let us watch it, and we will tell you.
 */
export function NextStep({ appUrl, certified }: { appUrl: string; certified: boolean }) {
  return (
    <div className="no-print mt-8 rounded-[var(--radius-card)] border border-iris/40 bg-iris/[0.05] p-6 sm:p-7">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
        {certified ? "Keep it that way" : "After you fix them"}
      </p>

      <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        {certified
          ? "This is true today. Not next week."
          : "The next edit can reopen any of these."}
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-dim">
        {certified ? (
          <>
            You&rsquo;ll keep editing this app, and every edit can reopen a hole
            you just closed. Assay can watch it: whenever you ship a change, it
            re-checks, and if something breaks it emails you the same day with
            the fix. One app watched free, alerts included. This pass is good for{" "}
            {VALID_DAYS} days on its own.
          </>
        ) : (
          <>
            Every fix above is yours already — free, no account, paste them
            straight back into your builder. The part you can&rsquo;t do yourself
            is notice when one comes back. Assay can watch this app: it re-checks
            whenever you ship, and emails you the day something reopens. One app
            watched free, alerts included.
          </>
        )}
      </p>

      <form action={continueWithApp} className="mt-6">
        <input type="hidden" name="url" value={appUrl} />
        <SubmitButton size="md" pendingText="One moment…">
          Watch this app — free
        </SubmitButton>
      </form>

      <p className="mt-3 font-mono text-xs text-ash">
        Free account, no card. This app is carried over — you won&rsquo;t retype it.
      </p>
    </div>
  );
}
