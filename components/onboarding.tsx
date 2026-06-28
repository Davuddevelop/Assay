import { Button } from "@/components/ui/button";
import { GitHubMark } from "@/components/icons";

const STEPS = [
  {
    n: "1",
    title: "Connect a repository",
    body: "Install the GitHub App on a repo you want checked. You choose exactly which ones.",
  },
  {
    n: "2",
    title: "Write your rules (optional)",
    body: "In plain language, tell Assay what must never happen — it checks every change against them.",
  },
  {
    n: "3",
    title: "Open a pull request",
    body: "On each PR, Assay runs your tests, a security scan, and your rules.",
  },
  {
    n: "4",
    title: "Get the hallmark",
    body: "✓ Assayed if it's sound, ⚠ Held if it breaks something — right on the PR, with the file and line.",
  },
];

/**
 * First-run experience for the empty dashboard. A clear, numbered path instead
 * of a dead-end empty state — so a brand-new user always knows the next move.
 */
export function Onboarding({ installUrl }: { installUrl: string }) {
  return (
    <div className="panel relative overflow-hidden p-8 sm:p-10">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-30" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Get started
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Strike your first hallmark in four steps
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ivory-dim">
          It takes about a minute. Connect a repo and the next change you push
          gets assayed automatically.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex gap-4 rounded-[var(--radius-control)] border border-line bg-surface/40 p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-iris/40 bg-iris/10 font-mono text-sm text-iris-soft">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-medium text-ivory">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ivory-dim">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Button href={installUrl} variant="primary" size="lg">
            <GitHubMark />
            Connect a repository
          </Button>
          <p className="mt-3 font-mono text-xs text-ash">
            GitHub will ask you to choose repositories and confirm — that&rsquo;s
            normal. You&rsquo;ll come right back here.
          </p>
        </div>
      </div>
    </div>
  );
}
