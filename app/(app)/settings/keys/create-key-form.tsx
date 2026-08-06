"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { createKeyAction, type CreateKeyState } from "@/app/(app)/settings/keys/actions";

type Target = "claude-code" | "cursor" | "terminal";

const TARGETS: { id: Target; label: string }[] = [
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "terminal", label: "Terminal" },
];

function configFile(endpoint: string, key: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        assay: {
          type: "http",
          url: endpoint,
          headers: { Authorization: `Bearer ${key}` },
        },
      },
    },
    null,
    2,
  );
}

function cliCommand(endpoint: string, key: string): string {
  return `claude mcp add --transport http assay ${endpoint} \\\n  --header "Authorization: Bearer ${key}"`;
}

/**
 * Create a key and show it exactly once.
 *
 * The plaintext never returns from the server again — it isn't stored, only its
 * hash is — so this is the single moment the person can copy it. That is also
 * the only moment we can hand them a config file that already works, so setup
 * lives here rather than in a snippet with a YOUR_KEY placeholder they have to
 * splice together themselves.
 */
export function CreateKeyForm({ endpoint }: { endpoint: string }) {
  const [state, action] = useActionState<CreateKeyState, FormData>(createKeyAction, {});
  const [target, setTarget] = useState<Target>("claude-code");
  const [copied, setCopied] = useState<string | null>(null);
  const { notify } = useToast();

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      notify({
        title: "Couldn't copy",
        message: "Select the text and copy it manually — the key won't be shown again.",
        tone: "warn",
      });
    }
  }

  if (state.key) {
    const key = state.key;
    const snippet = target === "terminal" ? cliCommand(endpoint, key) : configFile(endpoint, key);
    const instruction =
      target === "claude-code" ? (
        <>
          Save this as a file called <span className="text-ivory">.mcp.json</span> in the
          folder you open in Claude Code, then restart it.
        </>
      ) : target === "cursor" ? (
        <>
          Save this as <span className="text-ivory">.cursor/mcp.json</span> in your project
          (or <span className="text-ivory">~/.cursor/mcp.json</span> to use it everywhere),
          then restart Cursor.
        </>
      ) : (
        <>Paste this into your terminal and press enter.</>
      );

    return (
      <div className="panel mt-8 border-iris/40 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
          Your new key
        </p>
        <p className="mt-2 text-sm text-ivory-dim">
          This is the only time it will be shown — we store a hash, not the key, so it
          cannot be recovered. Lose it and you revoke it and make another.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60 px-4 py-3 font-mono text-sm text-ivory">
            {key}
          </code>
          <Button type="button" variant="ghost" size="md" onClick={() => copy(key, "key")}>
            {copied === "key" ? "Copied" : "Copy key"}
          </Button>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
            Set it up
          </p>
          <p className="mt-2 text-sm text-ivory-dim">
            Your key is already filled in below. Nothing to edit.
          </p>

          <div
            role="tablist"
            aria-label="Where to set up Assay"
            className="mt-4 flex flex-wrap gap-2"
          >
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={target === t.id}
                onClick={() => setTarget(t.id)}
                className={cn(
                  "h-9 rounded-[var(--radius-control)] border px-4 text-sm transition-colors",
                  target === t.id
                    ? "border-iris/50 bg-iris/10 text-ivory"
                    : "border-line text-ivory-dim hover:border-border-strong hover:text-ivory",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-ivory-dim">{instruction}</p>

          <div className="mt-3 flex flex-col gap-3">
            <pre className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60 p-4 font-mono text-xs text-ivory">
              {snippet}
            </pre>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(snippet, target)}
              >
                {copied === target
                  ? "Copied"
                  : target === "terminal"
                    ? "Copy command"
                    : "Copy file"}
              </Button>
            </div>
          </div>

          {target !== "terminal" && (
            <p className="mt-4 text-sm text-oxblood-soft">
              This file contains a live credential. If the folder is a git repository, add{" "}
              <span className="font-mono">
                {target === "cursor" ? ".cursor/mcp.json" : ".mcp.json"}
              </span>{" "}
              to your <span className="font-mono">.gitignore</span> before you commit.
            </p>
          )}

          <p className="mt-4 text-sm text-ash">
            Then ask it: <span className="text-ivory-dim">&ldquo;Check my app with Assay
            before I deploy&rdquo;</span> — with your app&rsquo;s address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="panel mt-8 p-6">
      <label
        htmlFor="label"
        className="font-mono text-xs uppercase tracking-[0.16em] text-ash"
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
          className="h-11 flex-1 rounded-[var(--radius-control)] border border-line bg-surface/60 px-4 text-sm text-ivory placeholder:text-ash focus:border-border-strong focus:outline-none"
        />
        <SubmitButton pendingText="Creating…">Create key</SubmitButton>
      </div>
      {state.error && <p className="mt-3 text-sm text-oxblood-soft">{state.error}</p>}
    </form>
  );
}
