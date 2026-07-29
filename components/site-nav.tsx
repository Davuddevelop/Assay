import Link from "next/link";

import { NavAccount } from "@/components/nav-account";
import { Wordmark } from "@/components/wordmark";
import { MobileMenu } from "@/components/mobile-menu";
import { NavLink } from "@/components/nav-link";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  // Continuous monitoring is the only thing we charge for, so the page that
  // explains it belongs in the nav — it was previously reachable only from the
  // sitemap.
  { href: "/watch", label: "Monitoring" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

/**
 * A floating glass pill nav — wordmark, a few quiet links, and a sign-in pill.
 */
export function SiteNav() {
  return (
    <div className="sticky top-3 z-40 px-4 sm:top-4">
      <nav className="glass mx-auto flex h-14 w-full max-w-3xl items-center xl:h-16 xl:max-w-4xl justify-between rounded-pill border border-border pl-5 pr-2.5">
        <Link
          href="/"
          aria-label="Assay home"
          className="rounded-pill transition-opacity hover:opacity-80"
        >
          <Wordmark />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <NavAccount />
          <MobileMenu links={LINKS} />
        </div>
      </nav>
    </div>
  );
}
