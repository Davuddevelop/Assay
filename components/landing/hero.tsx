"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui/button";
import { ProductMock } from "@/components/landing/product-mock";

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
    <section ref={root} className="relative overflow-hidden border-b border-line">
      {/* faint structural glow, anchored top-left — not a centered bloom */}
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[720px]">
        <div className="hero-aurora aurora absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <p className="hero-eyebrow inline-flex items-center gap-2 rounded-pill border border-border bg-surface/50 py-1 pl-1.5 pr-3.5 text-xs text-ivory-dim">
          <span className="rounded-pill bg-iris/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
            Independent
          </span>
          One check across Lovable, Bolt, Replit &amp; v0
        </p>

        <h1 className="mt-8 max-w-4xl font-display text-[2.9rem] font-bold leading-[1.02] tracking-[-0.035em] text-ivory sm:text-[5.4rem]">
          <span className="hero-word inline-block">The</span>{" "}
          <span className="hero-word font-accent inline-block text-[1.06em] font-normal tracking-normal text-iris-soft">
            independent
          </span>{" "}
          <span className="hero-word inline-block">check</span>{" "}
          <span className="hero-word inline-block">for</span>{" "}
          <span className="hero-word inline-block">AI-built</span>{" "}
          <span className="hero-word inline-block">apps.</span>
        </h1>

        <p className="hero-sub mt-7 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg">
          Real users. Real payments. Real data. The tool that wrote your code
          can&rsquo;t be the one that vouches for it — Assay is the outside check
          that proves your app is safe, with the exact fix for anything it finds.
        </p>

        <div className="hero-cta mt-9">
          <form
            onSubmit={onSubmit}
            className="flex max-w-md items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface/60 py-1.5 pl-4 pr-1.5"
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              aria-label="Your app URL"
              placeholder="yourapp.lovable.app"
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-ivory outline-none placeholder:text-ash"
            />
            <Button type="submit" variant="primary" size="sm">
              Scan my app
            </Button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ash">
            {["Exposed keys", "Open database", "Missing protections", "Plain-language fixes"].map(
              (chip) => (
                <span key={chip} className="inline-flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-iris-soft" />
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>

        {/* the product, framed, left-anchored */}
        <div className="hero-product relative mt-16">
          <div className="hero-parallax relative">
            <ProductMock className="max-w-3xl text-left" />
          </div>
        </div>
      </div>
    </section>
  );
}
