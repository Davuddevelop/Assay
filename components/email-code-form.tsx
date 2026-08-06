import { SubmitButton } from "@/components/ui/submit-button";
import { verifyEmailCode } from "@/app/auth/actions";
import { OTP_MIN_LENGTH, OTP_MAX_LENGTH } from "@/lib/auth-email";

/**
 * How email sign-in finishes: the numeric code from the email, typed in.
 *
 * This began as a fallback to a clickable link and became the only path,
 * because the link never worked reliably. Mail gateways and security scanners
 * fetch every URL in an email before the recipient opens it, which spends the
 * one-time token — so the first real click reports "already used" to someone
 * who never used it. Confirmed live on this product, not theorised. A typed
 * code has no URL for a scanner to visit, so it cannot be consumed early.
 *
 * The link is gone from the email entirely rather than kept as a secondary
 * option: a broken affordance is worse than no affordance, because the person
 * who clicks it concludes the product is broken rather than that their mail
 * provider is unusual.
 *
 * A plain `<details>`, not client state: whether it starts open is decided
 * server-side by the login page, from the same `sent`/`error` the page
 * already reads, so no JS is needed to get the right default.
 */
export function EmailCodeForm({
  next,
  dest,
  defaultOpen,
  email,
}: {
  next?: string;
  dest: string;
  defaultOpen: boolean;
  /** Prefilled from the pending-email cookie; empty when there isn't one. */
  email?: string;
}) {
  return (
    <details open={defaultOpen} className="group mt-7 w-full text-left">
      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            &rarr;
          </span>
          Already have a code?
        </span>
      </summary>

      <form action={verifyEmailCode} className="mt-4 space-y-3">
        {next && <input type="hidden" name="next" value={dest} />}
        <div>
          <label htmlFor="code-email" className="sr-only">
            Email address
          </label>
          <input
            id="code-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            defaultValue={email}
            placeholder="you@example.com"
            className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-surface/50 px-4 text-center text-base text-ivory outline-none transition-colors placeholder:text-ash focus:border-border-strong"
          />
        </div>
        <div>
          <label htmlFor="code" className="sr-only">
            Sign-in code from the email
          </label>
          {/* Length comes from the shared constants, not a literal. maxLength
              in particular is unforgiving: it silently refuses the extra
              keystrokes rather than showing an error, so a too-small value
              looks to the user like their keyboard stopped working. */}
          <input
            id="code"
            name="code"
            type="text"
            required
            inputMode="numeric"
            pattern={`[0-9]{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}`}
            maxLength={OTP_MAX_LENGTH}
            autoComplete="one-time-code"
            placeholder="Code from the email"
            className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-surface/50 px-4 text-center font-mono text-lg tracking-[0.3em] text-ivory outline-none transition-colors placeholder:tracking-normal placeholder:text-ash focus:border-border-strong"
          />
        </div>
        <SubmitButton
          variant="ghost"
          size="lg"
          className="w-full"
          pendingText="Verifying…"
        >
          Verify code
        </SubmitButton>
      </form>
    </details>
  );
}
