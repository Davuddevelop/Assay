"use client";

import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type State = "idle" | "checking" | "resolved" | "present" | "error";

/**
 * Re-check this fix — the activation loop. The user pastes the fix prompt into
 * their builder, ships it, then clicks here; we re-run just this check and, when
 * it's gone, the card flips to a green "Fixed" — the dopamine moment that makes
 * them believe the product (and sets up "keep it that way → watch it").
 */
export function RecheckButton({
  scanId,
  findingId,
}: {
  scanId: string;
  findingId: string;
}) {
  const [state, setState] = useState<State>("idle");

  async function recheck() {
    setState("checking");
    try {
      const res = await fetch("/api/scan/recheck", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scanId, findingId }),
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = (await res.json()) as { resolved: boolean };
      setState(data.resolved ? "resolved" : "present");
    } catch {
      setState("error");
    }
  }

  if (state === "resolved") {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-[var(--radius-control)] border border-iris/40 bg-iris/10 px-4 py-3 text-sm text-iris-soft">
        <span aria-hidden>✓</span>
        Fixed — this check now passes. Run a full re-scan to refresh your score
        and badge.
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={recheck}
        disabled={state === "checking"}
        className={cn(
          "inline-flex items-center gap-2 rounded-pill border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
          "border-border text-ivory-dim hover:border-border-strong hover:text-ivory",
          state === "checking" && "opacity-70",
        )}
      >
        {state === "checking" ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Re-checking…
          </>
        ) : state === "present" ? (
          "Re-check again"
        ) : (
          "I fixed it — re-check"
        )}
      </button>
      {state === "present" && (
        <span className="text-xs text-oxblood-soft">
          Still there — give your builder a moment, then re-check.
        </span>
      )}
      {state === "error" && (
        <span className="text-xs text-ash">Couldn&rsquo;t re-check just now.</span>
      )}
    </div>
  );
}
