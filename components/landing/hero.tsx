"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { ProductMock } from "@/components/landing/product-mock";
import { Silk } from "@/components/landing/silk";

export function Hero() {
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
      const el = root.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Orchestrated load: eyebrow → headline words → subhead → CTA → product.
        const tl = gsap.timeline({
          defaults: { ease: "power3.out", duration: 0.6 },
        });
        tl.from(".hero-eyebrow", { autoAlpha: 0, y: 16 })
          .from(
            ".hero-word",
            { autoAlpha: 0, yPercent: 60, duration: 0.55, stagger: 0.12 },
            "-=0.2",
          )
          .from(".hero-sub", { autoAlpha: 0, y: 16 }, "-=0.25")
          .from(".hero-cta", { autoAlpha: 0, y: 16 }, "-=0.3")
          .from(
            ".hero-product",
            { autoAlpha: 0, y: 28, duration: 0.8 },
            "-=0.2",
          );

        // Subtle scroll parallax on the aurora behind the product.
        gsap.to(".hero-aurora", {
          yPercent: 16,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Cursor parallax on the product — pointer-fine devices only.
      mm.add(
        "(prefers-reduced-motion: no-preference) and (pointer: fine)",
        () => {
          const xTo = gsap.quickTo(".hero-parallax", "x", {
            duration: 0.5,
            ease: "power3.out",
          });
          const yTo = gsap.quickTo(".hero-parallax", "y", {
            duration: 0.5,
            ease: "power3.out",
          });

          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            xTo(((e.clientX - r.left) / r.width - 0.5) * 28);
            yTo(((e.clientY - r.top) / r.height - 0.5) * 20);
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };

          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
          };
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      {/* Silk — ambient flowing-fabric background behind the hero, fading to onyx. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora absolute inset-0 opacity-40" />
        <Silk className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-onyx" />
        <div className="absolute inset-0 bg-onyx/30" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <p className="hero-eyebrow mx-auto inline-flex items-center gap-2 rounded-pill border border-border bg-surface/50 py-1 pl-1.5 pr-3.5 text-xs text-ivory-dim">
          <span className="rounded-pill bg-iris/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
            Independent
          </span>
          One check across Lovable, Bolt, Replit &amp; v0
        </p>

        <h1 className="mx-auto mt-7 max-w-3xl font-display text-[2.9rem] font-bold leading-[1.04] tracking-[-0.03em] text-ivory sm:text-7xl">
          <span className="hero-word inline-block">The</span>{" "}
          <span className="hero-word font-accent inline-block text-[1.06em] font-normal tracking-normal text-iris-soft">
            independent
          </span>{" "}
          <span className="hero-word inline-block">check</span>{" "}
          <span className="hero-word inline-block">for</span>{" "}
          <span className="hero-word inline-block">AI-built</span>{" "}
          <span className="hero-word inline-block">apps.</span>
        </h1>

        <p className="hero-sub mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg">
          Real users. Real payments. Real data. The tool that wrote your code
          can&rsquo;t be the one that vouches for it — Assay is the outside check
          that proves your app is safe, in plain English, with the exact fix for
          anything it finds.
        </p>

        <div className="hero-cta mt-9">
          {/* glassy URL scan field */}
          <form
            onSubmit={onSubmit}
            className="glass mx-auto flex max-w-md items-center gap-2 rounded-pill border border-border py-1.5 pl-5 pr-1.5"
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              aria-label="Your app URL"
              placeholder="yourapp.lovable.app"
              className="min-w-0 flex-1 bg-transparent text-sm text-ivory outline-none placeholder:text-ash"
            />
            <Button type="submit" variant="primary" size="sm">
              Scan my app
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Exposed keys", "Open database", "Missing protections", "Plain-language fixes"].map(
              (chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface/40 px-3 py-1 text-xs text-ivory-dim"
                >
                  <span className="h-1 w-1 rounded-full bg-iris-soft" />
                  {chip}
                </span>
              ),
            )}
          </div>
          <a
            href="/sample"
            className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.14em] text-iris-soft transition-colors hover:text-ivory"
          >
            See a sample report →
          </a>
        </div>

        {/* the product, framed, centered, on its aurora */}
        <div className="hero-product relative mt-20">
          <div className="hero-parallax relative">
            <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[640px] w-[1080px] max-w-[150vw] -translate-x-1/2">
              <div aria-hidden className="hero-aurora aurora absolute inset-0" />
            </div>
            <div className="float-soft relative">
              <ProductMock className="mx-auto max-w-3xl text-left" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
