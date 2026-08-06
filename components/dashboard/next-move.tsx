import Link from "next/link";

import type { Audience } from "@/lib/onboarding";

/**
 * What question two buys.
 *
 * The strategic artifact is the client-facing report (CLAUDE.md §3) and the
 * thing that makes someone come back is monitoring (§9). Both were reachable
 * only by knowing they existed. Showing both to everyone would be a link farm;
 * showing the wrong one is worse than showing neither.
 *
 * So this renders one thing, and only for someone who told us which they are.
 * If the answer is missing the component isn't rendered at all — a
 * personalized panel that falls back to a generic default teaches people that
 * answering changed nothing, which is exactly the failure mode CLAUDE.md §11
 * is written against.
 */
const MOVES: Record<Audience, { label: string; title: string; body: string; href: string; cta: string }> = {
  client: {
    label: "For client work",
    title: "Hand the report over, not the dashboard.",
    body: "Open any report and print it — no nav, no buttons, letterheaded and dated. It's the piece of paper that says an outside check was run before you invoiced.",
    href: "/client-handoff",
    cta: "How the handoff works →",
  },
  company: {
    label: "For your company",
    title: "Hand the report over, not the dashboard.",
    body: "Open any report and print it — no nav, no buttons, letterheaded and dated. It's the record that an outside check was run before this went live.",
    href: "/client-handoff",
    cta: "How the handoff works →",
  },
  self: {
    label: "Keep it checked",
    title: "A scan is a fact about the past.",
    body: "Apps change every time you ship. Watching one re-checks it and emails you the moment an edit reopens something that used to be closed.",
    href: "/watch",
    cta: "How monitoring works →",
  },
};

export function NextMove({ audience }: { audience: Audience | null }) {
  if (!audience) return null;
  const move = MOVES[audience];

  return (
    <section className="mt-12 border-t border-line pt-8">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
        {move.label}
      </p>
      <h2 className="mt-3 max-w-xl font-display text-xl font-semibold tracking-[-0.015em] text-ivory">
        {move.title}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ivory-dim">
        {move.body}
      </p>
      <Link
        href={move.href}
        className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.14em] text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
      >
        {move.cta}
      </Link>
    </section>
  );
}
