import Link from "next/link";

import { Wordmark } from "@/components/wordmark";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
    ],
  },
  {
    heading: "Account",
    links: [{ href: "/login", label: "Sign in with GitHub" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-obsidian">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-ash">
              An independent checkpoint for AI-written code. A mark struck on
              work that&rsquo;s sound.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-16">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ivory-dim transition-colors hover:text-ivory"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-6">
          <p className="font-mono text-xs text-ash">
            © {new Date().getFullYear()} Assay
          </p>
        </div>
      </div>
    </footer>
  );
}
