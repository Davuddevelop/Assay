import { SubmitButton } from "@/components/ui/submit-button";
import { verifyEmailCode } from "@/app/auth/actions";

/**
 * The fallback to the clickable sign-in link: the 6-digit code from the same
 * email, typed in by hand.
 *
 * It exists because the link alone isn't reliable. Some corporate mail
 * gateways and security scanners (Microsoft 365 Safe Links is the common one)
 * pre-fetch every link in an email before the recipient opens it, which burns
 * the one-time token — so the first real click reports "already used" for
 * someone who never used it. A typed code has no URL for that kind of thing
 * to visit.
 *
 * A plain `<details>`, not client state: whether it starts open is decided
 * server-side by the login page, from the same `sent`/`error` the page
 * already reads, so no JS is needed to get the right default.
 */
export function EmailCodeForm({
  next,
  dest,
  defaultOpen,
}: {
  next?: string;
  dest: string;
  defaultOpen: boolean;
}) {
  return (
    <details open={defaultOpen} className="group mt-7 w-full text-left">
      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            &rarr;
          </span>
          Enter the code instead
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
            placeholder="you@example.com"
            className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-surface/50 px-4 text-center text-base text-ivory outline-none transition-colors placeholder:text-ash focus:border-border-strong"
          />
        </div>
        <div>
          <label htmlFor="code" className="sr-only">
            6-digit code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="123456"
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
