import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { Eyebrow } from "@/components/section-heading";
import { RulesForm } from "@/components/rules-form";
import { getReposForRules } from "@/lib/data/queries";
import { githubAppInstallUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "Rules — Assay",
  description: "Plain-language rules Assay checks every change against.",
};

export default async function RulesPage() {
  const repos = await getReposForRules();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <header>
        <Eyebrow label="Rules" />
        <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">
          Rules, in plain language
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory-dim">
          Write what must never happen — &ldquo;never log card data&rdquo;,
          &ldquo;all API routes require auth&rdquo;. Assay checks every change
          against these, one per line.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {repos.length === 0 ? (
          <EmptyState
            title="No repositories yet"
            body="Connect a repository first, then write the rules Assay should hold it to."
            action={{ label: "Connect a repo", href: githubAppInstallUrl() }}
          />
        ) : (
          repos.map((repo) => <RulesForm key={repo.id} repo={repo} />)
        )}
      </div>
    </div>
  );
}
