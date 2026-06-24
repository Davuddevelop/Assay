import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GitHubMark } from "@/components/icons";
import { HallmarkMark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Sign in — Assay",
  description: "Connect your GitHub to begin.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <HallmarkMark className="h-10 w-10 text-gold" />

      <h1 className="mt-8 font-display text-3xl text-ivory">Sign in</h1>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Connect your GitHub to begin. Assay reads the repositories you choose and
        the checks it runs — nothing else.
      </p>

      {/* Mocked: advances to the dashboard. Supabase OAuth is wired later. */}
      <Button href="/dashboard" variant="primary" size="lg" className="mt-9 w-full">
        <GitHubMark />
        Continue with GitHub
      </Button>

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
