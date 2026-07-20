"use client";

import { useState, useTransition } from "react";

import { shareBadge } from "@/app/(app)/scan/actions";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/scan/copy-button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Share proof — turns a certified scan into a public, shareable page the owner
 * can link from their site ("Certified safe to publish by Assay"). Minting is
 * lazy: nothing public exists until the owner asks for it. The public page
 * carries the verification's freshness, so a link that ages quietly pressures a
 * re-check — the growth-plus-retention loop.
 */
export function BadgeShare({ scanId }: { scanId: string }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function mint() {
    setFailed(false);
    start(async () => {
      const path = await shareBadge(scanId);
      if (path) setUrl(`${window.location.origin}${path}`);
      else setFailed(true);
    });
  }

  if (url) {
    return (
      <div className="panel p-6 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Your proof is live
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          Share this link anywhere — it shows your app passed, when it was
          checked, and stays honest as it ages.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-pill border border-border bg-onyx/50 px-4 py-2 font-mono text-xs text-ivory">
            {url}
          </code>
          <div className="flex shrink-0 gap-2">
            <CopyButton text={url} label="Copy link" />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-pill border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:border-border-strong hover:text-ivory"
            >
              View
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Show it off
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          Turn this pass into a public proof page you can share with your users —
          &ldquo;Certified safe to publish by Assay.&rdquo;
          {failed && (
            <span className="mt-2 block text-oxblood-soft">
              Couldn&rsquo;t create the link. Try again.
            </span>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="md"
        onClick={mint}
        disabled={pending}
        className="shrink-0"
      >
        {pending ? (
          <>
            <Spinner className="h-3.5 w-3.5" /> Creating…
          </>
        ) : (
          "Share proof"
        )}
      </Button>
    </div>
  );
}
