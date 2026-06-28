import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";
import { RepoCard } from "@/components/repo-card";
import { CheckStatus } from "@/components/check-status";
import { PlanSummary } from "@/components/billing/plan-summary";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { requireUser, toSessionUser } from "@/lib/auth";
import { getWorkspace } from "@/lib/data/queries";
import { githubAppInstallUrl } from "@/lib/env";
import { relativeTime } from "@/lib/data/derive";

export const metadata: Metadata = {
  title: "Dashboard — Assay",
  description: "Your connected repositories and recent checks.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; connect_error?: string }>;
}) {
  const { connected, connect_error: connectError } = await searchParams;
  const session = toSessionUser(await requireUser());
  const { repos, recentChecks, usage, plan } = await getWorkspace();
  const installUrl = githubAppInstallUrl();
  const hasRepos = repos.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 opacity-40"
      />
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
          {session.name}&rsquo;s workspace
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
          {hasRepos ? "Your repositories" : "Nothing assayed yet."}
        </h1>
      </header>

      {connected !== undefined && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-iris/40 bg-iris/10 px-5 py-4 text-sm text-ivory">
          ✓ Connected. {Number(connected) > 0
            ? `${connected} ${Number(connected) === 1 ? "repository is" : "repositories are"} ready — the next change will be assayed.`
            : "Pick at least one repository on GitHub to start checking it."}
        </div>
      )}
      {connectError && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-oxblood/50 bg-oxblood/10 px-5 py-4 text-sm text-oxblood-soft">
          We couldn&rsquo;t finish connecting. Please try again, or reinstall the
          GitHub App.
        </div>
      )}

      {usage && (
        <div className="mt-8">
          <PlanSummary planId={plan} used={usage.used} limit={usage.limit} />
        </div>
      )}

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow label="Repositories" />
          {hasRepos && (
            <Button href={installUrl} variant="ghost" size="sm">
              + Add repository
            </Button>
          )}
        </div>
        <div className="mt-6">
          {hasRepos ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <Onboarding installUrl={installUrl} />
          )}
        </div>
      </section>

      <section className="mt-16">
        <Eyebrow label="Recent checks" />
        <div className="mt-6">
          {recentChecks.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
              {recentChecks.map((check) => (
                <li key={check.id}>
                  <Link
                    href={`/checks/${check.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-hover/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-ivory">
                        {check.commit_sha.slice(0, 7)}
                        {check.pr_number ? ` · PR #${check.pr_number}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-xs text-ash">
                        {relativeTime(check.created_at)}
                      </p>
                    </div>
                    <CheckStatus check={check} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface/40 px-6 py-12 text-center">
              <p className="text-sm text-ivory-dim">
                No checks yet. The first will appear here once a repository is
                connected and a change lands.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
