"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";

/**
 * The hero: one cinematic still, the argument in large type over it, and the
 * scan box. Nothing else.
 *
 * It replaces a centred stack — pill, headline, paragraph, form, chips, link,
 * floating product mock — that had six things competing down one vertical
 * axis. The reference this is built against (dark editorial SaaS pages) works
 * on restraint: one image, one sentence, one action.
 *
 * The image is deliberately of the thing the product is named after — an assay
 * office tests metal it didn't cast — rather than the abstract mountains and
 * galaxies those pages usually reach for. A galaxy belongs to nobody. A struck
 * silver bar belongs to us, and it means something a visitor can carry into
 * the argument below it.
 *
 * The silk shader is gone from this screen. Two atmospheric backgrounds
 * competing for the same attention is exactly the fault an outside critique
 * named ("the first impression is a shader, not a sentence"), and a still
 * image doesn't move across the headline while someone is trying to read it.
 * `components/landing/silk.tsx` still exists and /classic still uses it, so
 * restoring this is one import away if the photograph turns out worse.
 */

/**
 * Lives in `public/`, referenced by path rather than imported.
 *
 * A static import would fail the build outright if the file were missing; a
 * path 404s the image and leaves the page standing. That matters because the
 * headline is legible either way here — the scrim below is opaque enough on
 * its own — so a missing asset degrades to a plain dark hero instead of
 * taking the site down.
 */
const HERO_IMAGE = "/hero-assay.jpg";

export function HeroV2() {
  const root = useRef<HTMLElement>(null);
  const router = useRouter();
  const [url, setUrl] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    router.push(trimmed ? `/try?url=${encodeURIComponent(trimmed)}` : "/try");
  }

  useGSAP(
    () => {
      if (!root.current) return;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // gsap.from() leaves everything visible by default, so no-JS and
        // reduced-motion visitors get the finished hero rather than an empty
        // one waiting for an animation that never runs.
        gsap
          .timeline({ defaults: { ease: "power3.out", duration: 0.7 } })
          .from(".hero-eyebrow", { autoAlpha: 0, y: 14 })
          .from("h1", { autoAlpha: 0, y: 20 }, "-=0.45")
          .from(".hero-sub", { autoAlpha: 0, y: 16 }, "-=0.45")
          .from(".hero-cta", { autoAlpha: 0, y: 16 }, "-=0.45");
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[88svh] items-center overflow-hidden"
    >
      {/* Full bleed, and pulled up behind the floating nav so the first screen
          is one continuous image with no dark strip above it. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* On a phone the frame is portrait and the photograph is 21:9, so the
            crop is severe. Biased right, because that's where the lit subject
            is — measured contrast behind the headline stays at 9.4:1 even with
            the brightest part of the image directly behind it, so the crop can
            be chosen to keep the photograph worth looking at rather than to
            dodge the type. */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover object-[70%_center] sm:object-center"
          loading="eager"
          fetchPriority="high"
        />

        {/* Two scrims, doing different jobs. The horizontal one darkens the
            left, where the type sits, and lets the metal keep its contrast on
            the right. The vertical one lands the image into the page ground so
            there's no seam where the section ends.

            Heavier on small screens: a 21:9 photograph cropped to a phone puts
            the subject wherever it lands, so legibility can't depend on the
            composition surviving the crop. */}
        <div className="absolute inset-0 bg-onyx/78 sm:bg-gradient-to-r sm:from-onyx sm:from-25% sm:via-onyx/70 sm:to-onyx/10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-onyx" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-28 sm:px-6 sm:py-32 xl:max-w-7xl">
        <div className="max-w-2xl text-left xl:max-w-3xl">
          <p className="hero-eyebrow font-mono text-[11px] uppercase tracking-[0.22em] text-ash xl:text-xs">
            Independent · Lovable, Bolt, Replit &amp; v0
          </p>

          {/* The argument is the headline. Every competitor in this category
              leads with a list of checks, which is the fight we lose; the
              position is the one thing a platform's own scanner structurally
              cannot copy. */}
          <h1 className="mt-6 text-balance font-display text-[2.8rem] font-bold leading-[1.02] tracking-[-0.035em] text-ivory sm:text-6xl xl:text-[5rem]">
            The tool that built your app can&rsquo;t be the one that{" "}
            <span className="font-accent text-[1.06em] font-normal tracking-normal text-ivory">
              clears it.
            </span>
          </h1>

          <p className="hero-sub mt-7 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg">
            Assay is the outside check. Paste your app&rsquo;s link and we look
            at it the way a stranger would — no login, no access to your code —
            then tell you in plain English what&rsquo;s exposed and exactly how
            to fix it.
          </p>

          <div className="hero-cta mt-10">
            <form
              onSubmit={onSubmit}
              className="glass flex max-w-md items-center gap-2 rounded-pill border border-border py-1.5 pl-5 pr-1.5 xl:max-w-lg xl:py-2"
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
                autoComplete="off"
                aria-label="Your app URL"
                placeholder="yourapp.lovable.app"
                className="min-w-0 flex-1 bg-transparent text-sm text-ivory outline-none placeholder:text-ash xl:text-base"
              />
              <Button type="submit" variant="primary" size="sm">
                Scan my app
              </Button>
            </form>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ash xl:text-xs">
              Exposed keys · Open database · Missing protections
            </p>
            <a
              href="/sample"
              className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:text-ivory"
            >
              See a sample report →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
