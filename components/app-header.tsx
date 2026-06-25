import Link from "next/link";

import { Wordmark } from "@/components/wordmark";
import { mockUser } from "@/lib/mock";

const LINKS = [
  { href: "/dashboard", label: "Repositories" },
  { href: "/rules", label: "Rules" },
];

/**
 * Floating glass pill chrome for signed-in pages: wordmark, quiet links, and a
 * stub account chip (mocked until Supabase auth is wired).
 */
export function AppHeader() {
  return (
    <div className="sticky top-3 z-40 px-4 sm:top-4">
      <nav className="glass mx-auto flex h-14 w-full max-w-4xl items-center justify-between rounded-pill border border-border pl-5 pr-2.5">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            aria-label="Assay dashboard"
            className="rounded-pill transition-opacity hover:opacity-80"
          >
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ivory-dim transition-colors hover:text-ivory"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-pill border border-border bg-surface/50 py-1 pl-1 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-iris/20 font-mono text-xs text-iris-soft">
            {mockUser.initial}
          </span>
          <span className="hidden font-mono text-xs text-ivory-dim sm:inline">
            {mockUser.handle}
          </span>
        </div>
      </nav>
    </div>
  );
}
