import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { mockUser } from "@/lib/mock";

const LINKS = [
  { href: "/dashboard", label: "Repositories" },
  { href: "/rules", label: "Rules" },
];

/**
 * Slim app chrome for signed-in pages: the wordmark, a couple of quiet links,
 * and a stub account chip (mocked until Supabase auth is wired).
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-obsidian/85 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            aria-label="Assay dashboard"
            className="rounded-sm transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-7 md:flex">
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
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] border border-gold/60 font-mono text-xs text-gold">
            {mockUser.initial}
          </span>
          <span className="hidden font-mono text-xs text-ivory-dim sm:inline">
            {mockUser.handle}
          </span>
        </div>
      </nav>
    </header>
  );
}
