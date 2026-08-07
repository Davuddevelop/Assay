import { gaps, type CheckCoverage } from "@/lib/scan/coverage";
import { cn } from "@/lib/utils";

/**
 * What the scan examined, and what it couldn't.
 *
 * This sits with the findings rather than under them because it answers a
 * question the findings cannot: whether "no issues found" means anything.
 * A scan that never located the app's database produces the same empty list
 * as one that checked the database and found it locked — and until this
 * existed, both printed a clean report and earned the mark.
 *
 * Renders nothing when every check ran. A coverage note on a complete scan is
 * noise, and the panel appearing at all is itself the signal that something
 * was skipped.
 */
export function CoveragePanel({ coverage }: { coverage: CheckCoverage[] }) {
  const missing = gaps(coverage);
  if (missing.length === 0) return null;

  return (
    <section
      className={cn(
        "print-finding mt-8 rounded-[var(--radius-card)] border border-border bg-surface/40 p-6 sm:p-7",
      )}
      aria-labelledby="coverage-heading"
    >
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
        Coverage
      </p>
      <h2
        id="coverage-heading"
        className="mt-3 font-display text-xl font-semibold tracking-[-0.015em] text-ivory"
      >
        {missing.length === 1
          ? "One check couldn’t run."
          : `${missing.length} checks couldn’t run.`}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-dim">
        A check that didn&rsquo;t run is not a pass. Whatever this report says
        above, it says nothing about the following &mdash; so read them as gaps,
        not as clean results.
      </p>

      <dl className="mt-6 space-y-4">
        {missing.map((c) => (
          <div key={c.id} className="border-t border-line pt-4">
            <dt className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ivory">{c.label}</span>
              <span className="rounded-pill border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                {c.status === "incomplete" ? "incomplete" : "nothing found to check"}
              </span>
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-ivory-dim">
              {c.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
