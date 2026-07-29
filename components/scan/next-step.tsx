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
 * themselves: proof, and continuity. A person can fix their own app, but they
 * cannot verify it, cannot show anyone, and cannot notice the day it breaks
 * again. So that is what the ending asks them to come back for — and the ask
 * differs by verdict, because "you have nine problems" and "you have none" are
 * not the same conversation.
 */
export function NextStep({ appUrl, certified }: { appUrl: string; certified: boolean }) {
  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-iris/40 bg-iris/[0.05] p-6 sm:p-7">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
        {certified ? "Keep it" : "Next"}
      </p>

      <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        {certified ? "Now hold onto it." : "Fix these, then prove it."}
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-dim">
        {certified ? (
          <>
            Passing today isn&rsquo;t the same as passing next week — every edit can
            reopen a hole, and this pass is only good for {VALID_DAYS} days. Sign in
            to claim the badge for this app, and Assay re-checks it whenever it
            changes instead of you having to remember.
          </>
        ) : (
          <>
            Every fix above is yours already — free, no account, paste them straight
            back into your builder. What you don&rsquo;t have is proof you applied
            them. Sign in and re-run this same check: pass, and you get a badge you
            can show, and Assay tells you the day something reopens it.
          </>
        )}
      </p>

      <form action={continueWithApp} className="mt-6">
        <input type="hidden" name="url" value={appUrl} />
        <SubmitButton size="md" pendingText="One moment…">
          {certified ? "Claim my badge — free" : "Verify my fix — free"}
        </SubmitButton>
      </form>

      <p className="mt-3 font-mono text-xs text-ash">
        Free account, no card. This app is carried over — you won&rsquo;t retype it.
      </p>
    </div>
  );
}
