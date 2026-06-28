"use client";

import { Button } from "@/components/ui/button";

/** Friendly fallback for unexpected errors — never show users a raw stack. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">
        That didn&rsquo;t work.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
        A hiccup on our side. Try again — if it keeps happening, head back home
        and retry in a moment.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button onClick={() => reset()} variant="primary" size="md">
          Try again
        </Button>
        <Button href="/" variant="ghost" size="md">
          Back home
        </Button>
      </div>
    </div>
  );
}
