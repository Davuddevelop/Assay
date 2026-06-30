"use client";

import { useEffect, useState } from "react";

import { CopyButton } from "@/components/scan/copy-button";
import { createBadgeAction } from "@/app/(app)/scan/actions";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * The "earn your hallmark" box shown on a certified report. Before a badge is
 * minted it offers a one-click action; once minted (token in the URL) it shows
 * the public, shareable link with a copy button.
 */
export function BadgeShare({ scanId, token }: { scanId: string; token?: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    // Client-only: read the live origin so the shareable URL is absolute.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  if (token) {
    const url = `${origin}/badge/${token}`;
    return (
      <div className="rounded-[var(--radius-card)] border border-iris/30 bg-iris/5 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-iris-soft">
          Your hallmark is live
        </p>
        <p className="mt-2 text-sm text-ivory-dim">
          Share this public, read-only report to prove your app is safe to publish.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] border border-line bg-onyx/60 px-3 py-2 font-mono text-xs text-ivory">
            {url || `…/badge/${token}`}
          </code>
          <CopyButton text={url} label="Copy link" />
        </div>
      </div>
    );
  }

  return (
    <form
      action={createBadgeAction}
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-iris/30 bg-iris/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-iris-soft">
          Certified safe to publish
        </p>
        <p className="mt-2 text-sm text-ivory-dim">
          Mint a public hallmark you can share with users or link from your app.
        </p>
      </div>
      <input type="hidden" name="scanId" value={scanId} />
      <SubmitButton variant="primary" size="md" pendingText="Minting…">
        Get my hallmark
      </SubmitButton>
    </form>
  );
}
