import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/section-heading";
import { CheckStatus } from "@/components/check-status";
import { FindingItem } from "@/components/finding-item";
import { getCheckDetail } from "@/lib/data/queries";
import { relativeTime } from "@/lib/data/derive";
import { checkUrl } from "@/lib/github/urls";

export default async function CheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCheckDetail(id);
  if (!detail) notFound();

  const { check, repo, findings } = detail;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href={repo ? `/repos/${repo.id}` : "/dashboard"}
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← {repo ? repo.full_name : "Dashboard"}
      </Link>

      <header className="mt-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            Check · {relativeTime(check.created_at)}
          </p>
          <h1 className="mt-2 font-mono text-xl text-ivory">
            {check.commit_sha.slice(0, 7)}
            {check.pr_number ? ` · PR #${check.pr_number}` : ""}
          </h1>
          {repo && (
            <a
              href={checkUrl(repo.full_name, check.commit_sha, check.pr_number)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-iris-soft transition-colors hover:text-ivory"
            >
              View on GitHub ↗
            </a>
          )}
        </div>
        <CheckStatus check={check} size="md" />
      </header>

      {check.summary && (
        <p className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface/40 p-5 text-sm leading-relaxed text-ivory-dim">
          {check.summary}
        </p>
      )}

      <section className="mt-12">
        <Eyebrow label={`Findings${findings.length ? ` · ${findings.length}` : ""}`} />
        <div className="mt-5 space-y-3">
          {findings.length > 0 ? (
            findings.map((f) => <FindingItem key={f.id} finding={f} />)
          ) : (
            <p className="rounded-[var(--radius-card)] border border-line bg-surface/40 px-6 py-10 text-center text-sm text-ivory-dim">
              {check.status === "completed"
                ? "No issues found. The change is sound."
                : "Findings will appear here once the check completes."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
