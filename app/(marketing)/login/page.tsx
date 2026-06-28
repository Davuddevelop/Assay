import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";
import { LoginError } from "@/components/login-error";
import { signInWithGitHub } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Connect your GitHub to begin.",
};

// Static shell → served instantly from the edge; only the OAuth action hits the
// server. The error message is read client-side so this page never cold-starts.
export default function LoginPage() {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 bottom-0 top-1/3 opacity-90"
      />
      <HallmarkMark metallic className="relative h-10 w-10" />

      <h1 className="mt-8 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">Sign in</h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Connect your GitHub to begin. Assay reads the repositories you choose and
        the checks it runs — nothing else.
      </p>

      <Suspense fallback={null}>
        <LoginError />
      </Suspense>

      <form action={signInWithGitHub} className="mt-9 w-full">
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
        You grant read access to the repositories you select. Revoke it anytime
        from GitHub.
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
