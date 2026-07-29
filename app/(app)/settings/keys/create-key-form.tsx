"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createKeyAction, type CreateKeyState } from "@/app/(app)/settings/keys/actions";

/**
 * Create a key and show it exactly once.
 *
 * The plaintext never returns from the server again — it isn't stored, only its
 * hash is — so this is the single moment the person can copy it. The panel is
 * loud about that on purpose.
 */
export function CreateKeyForm() {
  const [state, action] = useActionState<CreateKeyState, FormData>(createKeyAction, {});
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  async function copy(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({
        title: "Couldn't copy",
        message: "Select the key and copy it manually — it won't be shown again.",
        tone: "warn",
      });
    }
  }

  if (state.key) {
    return (
      <div className="panel mt-8 border-iris/40 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Your new key
        </p>
        <p className="mt-2 text-sm text-ivory-dim">
          Copy it now. This is the only time it will be shown — we store a hash,
          not the key, so it cannot be recovered.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60 px-4 py-3 font-mono text-sm text-ivory">
            {state.key}
          </code>
          <Button type="button" variant="ghost" size="md" onClick={() => copy(state.key!)}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="panel mt-8 p-6">
      <label
        htmlFor="label"
        className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft"
      >
        New key
      </label>
      <p className="mt-2 text-sm text-ivory-dim">
        Name it after where it will live, so you know which one to revoke later.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="label"
          name="label"
          type="text"
          maxLength={80}
          placeholder="Cursor on my laptop"
          className="h-11 flex-1 rounded-pill border border-line bg-surface/60 px-4 text-sm text-ivory placeholder:text-ash focus:border-border-strong focus:outline-none"
        />
        <SubmitButton pendingText="Creating…">Create key</SubmitButton>
      </div>
      {state.error && <p className="mt-3 text-sm text-oxblood-soft">{state.error}</p>}
    </form>
  );
}
