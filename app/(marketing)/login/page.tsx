import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";
import { LoginError } from "@/components/login-error";
import { EmailCodeForm } from "@/components/email-code-form";
import { LegalNotice } from "@/components/legal-notice";
import { signInWithGitHub, signInWithEmail, signOut } from "@/app/auth/actions";
import { getUser, toSessionUser } from "@/lib/auth";
import { PENDING_EMAIL_COOKIE } from "@/lib/auth-email";
import { cookies } from "next/headers";
import { safeNext } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Sign in with an emailed code to begin.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; sent?: string; error?: string }>;
}) {
  const user = await getUser();
  const { next, sent, error } = await searchParams;
  const dest = safeNext(next ?? null);

  // Already signed in? Sending them to a sign-in form is a dead end — take
  // them where they were going instead.
  //
  // Unless a sign-in attempt just failed. Someone signed in as one account,
  // clicking a dead magic link for another, was silently bounced to the first
  // account's dashboard: the error redirect landed here, this line saw the
  // stale session and forwarded them on before they could read it. The
  // symptom is "the link logged me into the wrong account", the cause is that
  // the failure was never shown, and quietly leaving someone under an
  // identity they didn't just ask for is the part that actually matters.
  const attemptFailed = Boolean(error);
  if (user && !attemptFailed) redirect(dest);

  const staleSession = user ? toSessionUser(user) : null;

  // The address they just asked us to mail, so the code form arrives filled in
  // rather than asking for something they typed seconds ago.
  const pendingEmail = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value ?? "";

  // Open the code form whenever the code is the next thing to do: right after
  // one was sent, after a bad code, and after a failed GitHub round trip,
  // where email is the obvious alternative.
  const codeFormOpen = sent === "1" || error === "auth" || error === "code";

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div
        aria-hidden
        className="field pointer-events-none absolute inset-0"
      />
      <HallmarkMark className="relative h-10 w-10 text-ivory" />

      <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">Sign in</h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        No password. We&rsquo;ll email you a sign-in code. Then paste the
        address of an app you own and Assay will check it for security issues —
        nothing else.
      </p>

      <Suspense fallback={null}>
        <LoginError />
      </Suspense>

      {/* Say plainly whose session is still active. Without this, a failed
          sign-in leaves someone looking at a login page while silently still
          being someone else — and the moment they navigate anywhere, they're
          back in an account they didn't choose. */}
      {staleSession && (
        <div className="mt-4 w-full rounded-[var(--radius-control)] border border-border bg-surface/50 px-4 py-3.5 text-left">
          <p className="text-sm leading-relaxed text-ivory-dim">
            You&rsquo;re still signed in as{" "}
            <span className="font-mono text-ivory">{staleSession.handle}</span>.
            That sign-in attempt didn&rsquo;t change it.
          </p>
          <form action={signOut} className="mt-3">
            <SubmitButton variant="ghost" size="sm" pendingText="Signing out…">
              Sign out first
            </SubmitButton>
          </form>
        </div>
      )}

      {/* Email first, GitHub second. This product's premise is that you don't
          need to be a developer, and GitHub was the only door — a wall shaped
          like an assumption the product had already dropped. */}
      <form action={signInWithEmail} className="mt-9 w-full">
        {next && <input type="hidden" name="next" value={dest} />}
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-surface/50 px-4 text-center text-base text-ivory outline-none transition-colors placeholder:text-ash focus:border-border-strong"
        />
        <SubmitButton
          variant="primary"
          size="lg"
          className="mt-3 w-full"
          pendingText="Sending your code…"
        >
          Email me a sign-in code
        </SubmitButton>
      </form>

      <EmailCodeForm
        next={next}
        dest={dest}
        defaultOpen={codeFormOpen}
        email={pendingEmail}
      />

      <div className="mt-7 flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGitHub} className="mt-7 w-full">
        {next && <input type="hidden" name="next" value={dest} />}
        <SubmitButton
          variant="ghost"
          size="lg"
          className="w-full"
          pendingText="Connecting to GitHub…"
        >
          <GitHubMark />
          Continue with GitHub
        </SubmitButton>
      </form>

      <p className="mt-6 font-mono text-xs leading-relaxed text-ash">
        We use GitHub only to sign you in — no access to your repositories.
      </p>

      {/* Below both sign-in forms and above nothing else, so it is the last
          thing under the buttons rather than a footer link. The version is
          recorded server-side the moment a session exists — see
          completeSignIn. */}
      <LegalNotice action="signing in" className="mt-8 max-w-sm text-center" />

      <Link
        href="/"
        className="mt-10 font-mono text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory"
      >
        ← Back to home
      </Link>
    </div>
  );
}
