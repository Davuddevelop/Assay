"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

/**
 * Mobile-only nav: a hamburger that opens a dropdown of links. Keeps the nav
 * usable on small screens, where the inline links are hidden.
 */
export function MobileMenu({
  links,
  footer,
}: {
  links: NavLink[];
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-pill border border-border text-ivory transition-colors hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* click-away */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass absolute right-0 top-12 z-50 w-56 rounded-[var(--radius-card)] border border-border p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-[var(--radius-control)] px-3 py-2.5 text-sm text-ivory-dim transition-colors hover:bg-surface hover:text-ivory"
              >
                {link.label}
              </Link>
            ))}
            {footer && <div className="mt-1 border-t border-line px-1 pt-2">{footer}</div>}
          </div>
        </>
      )}
    </div>
  );
}
