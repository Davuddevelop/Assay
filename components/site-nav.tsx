import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

/**
 * Minimal top bar: the wordmark, a few quiet links, and GitHub sign-in.
 * Hairline below, generous height, nothing loud.
 */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-onyx/85 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Assay home"
          className="rounded-sm transition-opacity hover:opacity-80"
        >
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:text-ivory"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* href is stubbed to /login (not built this pass). */}
        <Button href="/login" variant="primary" size="sm">
          Sign in with GitHub
        </Button>
      </nav>
    </header>
  );
}
