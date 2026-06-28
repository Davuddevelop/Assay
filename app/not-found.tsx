import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HallmarkMark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 top-1/4 h-64 opacity-50"
      />
      <HallmarkMark metallic className="relative h-10 w-10" />
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-ash">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-ivory">
        Nothing assayed here.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
        This page doesn&rsquo;t exist. Let&rsquo;s get you back to solid ground.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button href="/" variant="primary" size="md">
          Back home
        </Button>
        <Link
          href="/dashboard"
          className="font-mono text-xs uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory"
        >
          Dashboard →
        </Link>
      </div>
    </div>
  );
}
