import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/section-heading";
import { CheckStatus } from "@/components/check-status";
import { getRepo, getRepoChecks } from "@/lib/data/queries";
import { relativeTime } from "@/lib/data/derive";
import { repoUrl } from "@/lib/github/urls";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = await getRepo(id);
  if (!repo) notFound();

  const checks = await getRepoChecks(id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <Link
        href="/dashboard"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Dashboard
      </Link>

      <header className="mt-6">
        <h1 className="font-mono text-2xl text-ivory">{repo.full_name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs text-ash">
            default branch · {repo.default_branch}
          </p>
          <a
            href={repoUrl(repo.full_name)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-iris-soft transition-colors hover:text-ivory"
          >
            View on GitHub ↗
          </a>
        </div>
      </header>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <Eyebrow label="Rules" />
          <Link
            href="/rules"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-iris-soft hover:text-ivory"
          >
            Edit →
          </Link>
        </div>
        <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface/40 p-5">
          {repo.rules.trim() ? (
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ivory-dim">
              {repo.rules}
            </pre>
          ) : (
            <p className="text-sm text-ash">
              No rules yet. Add plain-language rules so Assay checks every change
              against them.
            </p>
          )}
        </div>
      </section>

      <section className="mt-14">
        <Eyebrow label="Checks" />
        <div className="mt-5">
          {checks.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
              {checks.map((check) => (
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
            <p className="rounded-[var(--radius-card)] border border-line bg-surface/40 px-6 py-10 text-center text-sm text-ivory-dim">
              No checks yet. The next change to this repo will be assayed.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
