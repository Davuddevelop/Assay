import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";
import { signInWithGitHub } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Connect your GitHub to begin.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

      {error && (
        <p className="mt-6 w-full rounded-[var(--radius-control)] border border-oxblood/50 bg-oxblood/10 px-4 py-3 text-sm text-oxblood-soft">
          Sign-in didn&rsquo;t complete. Please try again.
        </p>
      )}

      <form action={signInWithGitHub} className="mt-9 w-full">
        <Button type="submit" variant="primary" size="lg" className="w-full">
          <GitHubMark />
          Continue with GitHub
        </Button>
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
