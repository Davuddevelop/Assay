import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { Eyebrow } from "@/components/section-heading";
import { SubmitButton } from "@/components/ui/submit-button";
import { getReposForRules } from "@/lib/data/queries";
import { githubAppInstallUrl } from "@/lib/env";
import { saveRules } from "@/app/(app)/rules/actions";

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
          repos.map((repo) => (
            <form
              key={repo.id}
              action={saveRules}
              className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-5"
            >
              <input type="hidden" name="repoId" value={repo.id} />
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-ivory">{repo.full_name}</p>
              </div>
              <textarea
                name="rules"
                rows={6}
                defaultValue={repo.rules}
                placeholder="never log card data&#10;all API routes require auth&#10;no secrets in source"
                className="mt-4 w-full resize-y rounded-[var(--radius-control)] border border-border bg-onyx/60 px-4 py-3 font-mono text-sm leading-relaxed text-ivory outline-none placeholder:text-ash focus:border-iris/50"
              />
              <div className="mt-4 flex justify-end">
                <SubmitButton variant="ghost" size="sm" pendingText="Saving…">
                  Save rules
                </SubmitButton>
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
