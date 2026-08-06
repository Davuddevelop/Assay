"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { NavLink } from "@/components/nav-link";
import { cn } from "@/lib/utils";

/**
 * The chrome, for both the marketing site and the signed-in app.
 *
 * What this replaces: a floating glass capsule, inset from every edge, with a
 * blurred translucent fill and a full border ringing it. That shape is the
 * single most-copied piece of AI-startup chrome there is — it is what every
 * builder template emits — and it sat on top of a photograph that had just
 * been graded for a week, cutting a hole in the first screen.
 *
 * This is the shape the tools this brand is measured against actually use:
 * full width, one hairline, nothing else. It is a horizon line, not an object.
 *
 * Two states, and the transition between them is the whole idea:
 *
 *   at the top — completely invisible. No fill, no border. The hero photograph
 *   runs edge to edge and under it, so the first screen is one image with type
 *   on it rather than an image with a widget parked on it.
 *
 *   scrolled — the ground comes up behind it and a single hairline appears.
 *
 * The scroll listener is passive and reads one boolean; it is the cheapest
 * possible way to buy the detail that makes chrome feel considered rather than
 * placed. Server-rendered in the `false` state, which is correct for a page
 * load at the top and harmless anywhere else.
 */
export type NavItem = { href: string; label: string };

export function NavBar({
  homeHref,
  homeLabel,
  links,
  children,
  className,
}: {
  homeHref: string;
  homeLabel: string;
  links: NavItem[];
  /** Right-hand side: account chip, sign-in button, mobile menu. */
  children: React.ReactNode;
  className?: string;
}) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        lifted
          ? "border-b border-line bg-onyx/80 backdrop-blur-md"
          : "border-b border-transparent",
        className,
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 xl:h-16 xl:max-w-7xl">
        <div className="flex items-center gap-9">
          <Link
            href={homeHref}
            aria-label={homeLabel}
            className="rounded-[var(--radius-control)] transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </Link>
          {/* Left-aligned beside the wordmark rather than absolutely centred.
              A centred group has to be positioned against the viewport, which
              means it drifts out of alignment with everything below it the
              moment the container is not the full width. This sits on the same
              left edge as the headline. */}
          <div className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">{children}</div>
      </nav>
    </header>
  );
}
