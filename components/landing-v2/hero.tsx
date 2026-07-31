"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Silk } from "@/components/landing/silk";
import { MARK_PATH, MARK_VIEWBOX } from "@/lib/brand";

const CHECKS = ["Exposed keys", "Open database", "Missing headers", "Unsafe defaults"];

/**
 * v2 hero — silk as material, not as glow.
 *
 * The original hero centres everything over a bright aurora. Here the silk is
 * pushed dark and graded away from the type so it behaves like the surface the
 * page is printed on. Everything is set left against a fixed measure, and the
 * mark is presented on the right as a drawing plate: framed, captioned,
 * cornered. That plate is doing the work the aurora used to do, without the
 * bloom.
 */
export function HeroV2Sharp() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    router.push(trimmed ? `/try?url=${encodeURIComponent(trimmed)}` : "/try");
  }

  return (
    <section className="relative overflow-hidden border-b border-white/[0.07]">
      {/* z-0, not -z-10: the layout paints an opaque ground, and a negative
          layer would sit behind it and never be seen. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <Silk className="absolute inset-0 h-full w-full opacity-90" />
        {/* Graded away from the type so the headline never fights a fold, and
            left open on the right so the material is actually legible there. */}
        <div className="absolute inset-0 bg-[linear-gradient(103deg,#08080a_0%,rgba(8,8,10,0.96)_24%,rgba(8,8,10,0.86)_42%,rgba(8,8,10,0.5)_66%,rgba(8,8,10,0.42)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#08080a]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[76rem] grid-cols-1 gap-16 px-6 pb-24 pt-36 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:pb-28 lg:pt-40">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-white/25" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8f8f97]">
              Independent security check
            </span>
          </div>

          <h1 className="mt-9 max-w-[16ch] font-display text-[2.7rem] font-bold leading-[1.04] tracking-[-0.035em] text-[#f4f1ea] sm:text-[3.6rem] lg:text-[4.1rem]">
            AI built your app.
            <br />
            Assay checks what it left{" "}
            <span className="text-[#8b8bf0]">open</span>.
          </h1>

          <p className="mt-8 max-w-[46ch] text-[15px] leading-[1.7] text-[#9a9aa2] sm:text-base">
            The tool that wrote your code can&rsquo;t be the one that vouches for
            it. Point Assay at a live URL and it reports what a stranger could
            reach — in plain English, with the exact fix.
          </p>

          <form onSubmit={onSubmit} className="mt-11 flex max-w-[30rem] items-stretch">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              aria-label="Your app URL"
              placeholder="yourapp.lovable.app"
              className="min-w-0 flex-1 rounded-l-[2px] border border-r-0 border-white/[0.14] bg-white/[0.02] px-4 py-3 font-mono text-[13px] text-[#f4f1ea] outline-none transition-colors placeholder:text-[#5a5a62] focus:border-white/30"
            />
            <button
              type="submit"
              className="shrink-0 rounded-r-[2px] bg-[#f4f1ea] px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#08080a] transition-colors hover:bg-white"
            >
              Check it
            </button>
          </form>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5a5a62]">
            Free · No account · Scan only apps you own
          </p>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.07] pt-6">
            {CHECKS.map((c, i) => (
              <span key={c} className="flex items-center gap-6">
                {i > 0 && <span aria-hidden className="hidden h-3 w-px bg-white/[0.12] sm:block" />}
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6f78]">
                  {c}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* The drawing plate. Corner ticks and a caption, so the mark reads as a
            specimen under examination rather than a logo dropped on a page. */}
        <div className="hidden lg:col-span-5 lg:flex lg:items-center lg:justify-end">
          <figure className="relative w-full max-w-[19rem]">
            <div className="relative aspect-square border border-white/[0.1]">
              {[
                "-left-px -top-px border-l border-t",
                "-right-px -top-px border-r border-t",
                "-bottom-px -left-px border-b border-l",
                "-bottom-px -right-px border-b border-r",
              ].map((pos) => (
                <span
                  key={pos}
                  aria-hidden
                  className={`absolute h-3 w-3 border-white/40 ${pos}`}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center p-14">
                <svg viewBox={MARK_VIEWBOX} className="h-full w-full" aria-hidden>
                  <path fill="#f4f1ea" fillRule="evenodd" d={MARK_PATH} />
                </svg>
              </div>
            </div>
            <figcaption className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-[#5a5a62]">
              <span>Fig. 01 — the hallmark</span>
              <span>Struck on pass</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
