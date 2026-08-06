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
 * path 404s the image and leaves the page standing. That is not theoretical —
 * a PR merged this component before the image reached public/, and production
 * served a hero with a dead src for several minutes. It degraded to a plain
 * dark hero with legible type instead of taking the site down.
 */
const HERO_IMAGE = "/hero-assay.jpg";
const HERO_IMAGE_SMALL = "/hero-assay-1200.jpg";

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
        {/* Two sizes rather than one. The source was a 4.3MB PNG, which would
            have been the slowest asset on the site on the page everyone lands
            on; these are 148KB and 46KB.

            The two crops are chosen for opposite reasons. On desktop the
            window is biased left so the lit ingot lands in the right third,
            clear of the headline. On a phone it is biased much further left,
            onto the dark textured slate, and that is deliberate: a 390px
            portrait window over a 21:9 frame cannot show a bright subject
            *and* carry ~500px of text without one of them losing. Measured, an
            ingot behind the sub-paragraph gave 2.02:1 where 4.5:1 is required.
            The slate reads as photograph, holds texture, and lets the scrim
            stay light. */}
        <img
          src={HERO_IMAGE}
          srcSet={`${HERO_IMAGE_SMALL} 1200w, ${HERO_IMAGE} 2400w`}
          sizes="100vw"
          alt=""
          className="h-full w-full object-cover object-[16%_center] sm:object-[26%_center]"
          loading="eager"
          fetchPriority="high"
        />

        {/* Darken where the words are, and nowhere else.
            A broad even wash is the obvious approach and the wrong one: it
            costs the photograph everywhere in order to protect type that only
            occupies the left half. This reaches full transparency by 72%, so
            the ingot and the beam are seen at the brightness they were shot
            at. It can afford to be this light because the frame's left third
            is already near-black in the photograph itself (mean 15 of 255) —
            the scrim is insurance against the crop moving, not the main
            defence.

            Note the base bg-onyx/38 applies at every breakpoint; the `sm:`
            classes replace the background-image, not the colour, so lowering
            it lightens desktop too. Verified per element with the text hidden
            rather than by eye — worst-pixel contrast is 4.02:1 behind the h1
            (needs 3:1 at 85px) and 6-7:1 behind the body copy (needs 4.5:1).

            The second, vertical scrim lands the image into the page ground so
            there's no seam where the section ends. */}
        <div className="absolute inset-0 bg-onyx/38 sm:bg-gradient-to-r sm:from-onyx sm:from-18% sm:via-onyx/72 sm:via-42% sm:to-transparent sm:to-72%" />
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
