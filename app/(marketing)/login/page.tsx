import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";
import { LoginError } from "@/components/login-error";
import { signInWithGitHub, signInWithEmail } from "@/app/auth/actions";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Sign in with an email link to begin.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in? Sending them to a sign-in form is a dead end — take them
  // where they were going instead.
  const user = await getUser();
  const { next } = await searchParams;
  const dest = safeNext(next ?? null);
  if (user) redirect(dest);

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 bottom-0 top-1/3 opacity-90"
      />
      <HallmarkMark className="relative h-10 w-10 text-ivory" />

      <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">Sign in</h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        No password. We&rsquo;ll email you a link. Then paste the link to an app
        you own and Assay will check it for security issues — nothing else.
      </p>

      <Suspense fallback={null}>
        <LoginError />
      </Suspense>

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
          pendingText="Sending your link…"
        >
          Email me a sign-in link
        </SubmitButton>
      </form>

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

      <Link
        href="/"
        className="mt-10 font-mono text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory"
      >
        ← Back to home
      </Link>
    </div>
  );
}
