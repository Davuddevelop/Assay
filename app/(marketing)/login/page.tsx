import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";
import { LoginError } from "@/components/login-error";
import { signInWithGitHub } from "@/app/auth/actions";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Connect your GitHub to begin.",
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
        Sign in with GitHub to begin. Then paste the link to an app you own and
        Assay will check it for security issues — nothing else.
      </p>

      <Suspense fallback={null}>
        <LoginError />
      </Suspense>

      <form action={signInWithGitHub} className="mt-9 w-full">
        {next && <input type="hidden" name="next" value={dest} />}
        <SubmitButton
          variant="primary"
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
        Revoke it anytime from GitHub.
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
