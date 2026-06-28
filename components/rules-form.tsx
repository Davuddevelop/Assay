"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { saveRules, type SaveRulesState } from "@/app/(app)/rules/actions";

const INITIAL: SaveRulesState = { ok: false };

/** Per-repo rules editor with inline save state ("Saving…" → "Saved ✓"). */
export function RulesForm({
  repo,
}: {
  repo: { id: string; full_name: string; rules: string };
}) {
  const [state, formAction] = useActionState(saveRules, INITIAL);

  return (
    <form
      action={formAction}
      className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-5"
    >
      <input type="hidden" name="repoId" value={repo.id} />
      <p className="font-mono text-sm text-ivory">{repo.full_name}</p>
      <textarea
        name="rules"
        rows={6}
        defaultValue={repo.rules}
        placeholder="never log card data&#10;all API routes require auth&#10;no secrets in source"
        className="mt-4 w-full resize-y rounded-[var(--radius-control)] border border-border bg-onyx/60 px-4 py-3 font-mono text-sm leading-relaxed text-ivory outline-none placeholder:text-ash focus:border-iris/50"
      />
      <div className="mt-4 flex items-center justify-end gap-3">
        {state.ok && (
          <span className="font-mono text-xs text-iris-soft">Saved ✓</span>
        )}
        {state.message && (
          <span className="font-mono text-xs text-oxblood-soft">{state.message}</span>
        )}
        <SubmitButton variant="ghost" size="sm" pendingText="Saving…">
          Save rules
        </SubmitButton>
      </div>
    </form>
  );
}
