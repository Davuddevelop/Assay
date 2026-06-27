import Link from "next/link";

import { CheckStatus } from "@/components/check-status";
import { relativeTime } from "@/lib/data/derive";
import type { RepoWithStatus } from "@/lib/data/queries";

/** A connected repository with its current hallmark. Links to the repo view. */
export function RepoCard({ repo }: { repo: RepoWithStatus }) {
  const latest = repo.latestCheck;
  return (
    <Link
      href={`/repos/${repo.id}`}
      className="panel lift block p-5 hover:border-iris/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-ivory">{repo.full_name}</p>
          <p className="mt-1 font-mono text-xs text-ash">
            {repo.default_branch}
            {latest ? ` · ${relativeTime(latest.created_at)}` : " · no checks yet"}
          </p>
        </div>
        {latest ? (
          <CheckStatus check={latest} />
        ) : (
          <span className="rounded-pill border border-border bg-surface/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Idle
          </span>
        )}
      </div>
    </Link>
  );
}
