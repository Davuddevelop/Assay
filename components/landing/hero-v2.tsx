"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import {
  HERO_IMAGE,
  HERO_IMAGE_SMALL,
  HERO_IMAGE_PORTRAIT,
} from "@/lib/hero-image";

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

export function HeroV2({ portrait = false }: { portrait?: boolean }) {
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
      // Pulled up under the header by exactly its height. The header is now a
      // full-width bar in normal flow rather than a floating capsule, so it
      // occupies 56px (64 at xl) of layout above this section — and with a
      // transparent header that band rendered as flat page-ground sitting on
      // top of the photograph, a hard seam across the first screen. This puts
      // the image back under it, which is the whole point of a transparent bar.
      className="relative isolate -mt-14 flex min-h-[88svh] items-center overflow-hidden xl:-mt-16"
    >
      {/* Full bleed. The section itself is what reaches under the header now,
          so this no longer needs its own negative offset. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Two sizes rather than one. The source was a 4.3MB PNG, which would
            have been the slowest asset on the site on the page everyone lands
            on; these are 186KB and 58KB, graded and re-encoded from the
            original rather than from the earlier JPEG, so the tone curve isn't
            applied on top of existing compression.

            The two crops are chosen for opposite reasons. On desktop the
            window is biased hard left so the lit ingot clears the headline
            entirely — at 26% it sat under "clears it." and pulled worst-pixel
            contrast to 1.84:1 against a 3:1 requirement, and 8% failed the
            same way at 2.43:1 once the section moved up under the header. This
            number is empirical, not chosen: it is whatever keeps the metal
            clear of the type, and it has to be re-measured any time the hero's
            geometry changes.

            The phone crop below is the fallback for when no portrait
            photograph is present: it runs further left still, onto dark
            textured slate, because a 390px window over a 21:9 frame cannot
            show a bright subject *and* carry ~500px of text without one of
            them losing — measured, an ingot behind the sub-paragraph gave
            2.02:1 where 4.5:1 is required. Legible, and it hides the one
            object this brand is built around from every mobile visitor, which
            is what the portrait asset exists to fix.

            Plain <img>, not next/image: it is two hand-graded fixed-size JPEGs
            with an explicit srcSet, so the optimizer has nothing left to do
            except add a per-request transform we'd be billed for. */}
        {/* <picture>, not a second <img>, so the phone downloads one file
            and never both.

            The portrait <source> is rendered only when the file is actually in
            public/ — the page checks and passes `portrait`. That check exists
            because a <source> is not a fallback: if its srcset 404s the
            browser shows a broken image rather than dropping back to the
            <img>. A PR once merged this component before its image landed and
            production served a dead src for several minutes; that degraded
            gracefully precisely because it was a plain <img>. This keeps that
            property. */}
        <picture>
          {portrait && (
            <source media="(max-width: 639px)" srcSet={HERO_IMAGE_PORTRAIT} />
          )}
          {/* No eslint-disable needed any more: @next/next/no-img-element
              does not fire on an <img> inside a <picture>, which is the
              sanctioned way to hand-manage art direction. */}
          <img
            src={HERO_IMAGE}
            srcSet={`${HERO_IMAGE_SMALL} 1200w, ${HERO_IMAGE} 2400w`}
            sizes="100vw"
            alt=""
            className={
              portrait
                ? // With a frame composed for the window, the subject is where
                  // it was put — so the phone crop stops running away from it.
                  "h-full w-full object-cover object-center sm:object-[2%_center]"
                : "h-full w-full object-cover object-[16%_center] sm:object-[2%_center]"
            }
            loading="eager"
            fetchPriority="high"
          />
        </picture>

        {/* Barely any scrim left, on purpose.
            The heavy lifting moved into the photograph: it is graded with a
            steepened tone curve, which drops the left third from mean 15 to
            mean 5 of 255 while holding the metal's brightness. The blacks the
            type sits on are now the image's own, so the overlay no longer has
            to manufacture them — and the silver reads at close to full
            strength instead of through a wash.

            Note the base opacity applies at every breakpoint; the `sm:`
            classes replace the background-image, not the colour, so changing
            it moves desktop too.

            The second, vertical scrim lands the image into the page ground so
            there's no seam where the section ends. */}
        <div className="absolute inset-0 bg-onyx/30 sm:bg-gradient-to-r sm:from-onyx/92 sm:from-14% sm:via-onyx/60 sm:via-40% sm:to-transparent sm:to-70%" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-onyx" />
      </div>

      {/* Four things, and nothing else: label, argument, one line, one action.
          It was six — eyebrow, headline, a four-line paragraph, the form, a
          list of checks, and a second link — all stacked down one column, each
          asking for a share of the same attention. That stack is what makes a
          page look generated rather than designed; the reference pages this is
          measured against are restrained in exactly this way, and the copy
          budget is the reason, not the photograph. */}
      {/* Top padding carries the header's height on top of the section's own,
          so the eyebrow never rides up under the wordmark. */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-36 sm:px-6 sm:pb-32 sm:pt-40 xl:max-w-7xl">
        <div className="max-w-2xl text-left xl:max-w-3xl">
          {/* The platforms alone. "Independent" used to sit here too, which was
              the headline's job — saying it twice made it read as a claim
              rather than an argument. */}
          <p className="hero-eyebrow font-mono text-[11px] uppercase tracking-[0.28em] text-ash xl:text-xs">
            Lovable · Bolt · Replit · v0
          </p>

          {/* The argument is the headline. Every competitor in this category
              leads with a list of checks, which is the fight we lose; the
              position is the one thing a platform's own scanner structurally
              cannot copy.

              One face, one weight, no italic-serif word inside it. The accent
              span on "clears it." was meant as emphasis and read as a wobble,
              because a 5rem line that changes family mid-sentence looks like
              two decisions rather than one. Emphasis at this size comes from
              scale and tracking; it doesn't need a costume. */}
          <h1 className="mt-7 text-balance font-display text-[2.7rem] font-semibold leading-[0.94] tracking-[-0.042em] text-ivory sm:text-[4.25rem] xl:text-[5.25rem]">
            The tool that built your app can&rsquo;t be the one that clears it.
          </h1>

          {/* Sixteen words, down from thirty-four. Everything cut — no login,
              no code access, plain English — is stated below the fold where
              there's room for it; up here it was three lines of qualifier
              between the argument and the box you type in. */}
          <p className="hero-sub mt-8 max-w-md text-base leading-relaxed text-ivory-dim sm:text-lg">
            Paste your app&rsquo;s link. We look at it from the outside, then
            show you exactly what to fix.
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

            {/* One tertiary item, not two. The checks strip that sat here is
                the whole subject of the next section down, and the sample
                report is the more useful of the two because it's the thing
                someone can look at before typing anything. */}
            <a
              href="/sample"
              className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-ivory xl:text-xs"
            >
              See a sample report →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
