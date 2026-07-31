import Link from "next/link";

import { HallmarkMark } from "@/components/wordmark";

const LINKS = [
  { href: "#problem", label: "Why" },
  { href: "#specimen", label: "Report" },
  { href: "#how", label: "Process" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * v2 chrome — a hairline bar, not a floating pill.
 *
 * The pill nav reads as a widget sitting on top of the page. A rule that runs
 * the full width reads as the page's own edge, which is the whole difference
 * between "app UI" and "printed thing".
 */
export function NavV2() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#08080a]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[76rem] items-center justify-between px-6 sm:px-10">
        <Link href="/v2" className="flex items-center gap-2.5" aria-label="Assay">
          <HallmarkMark className="h-[18px] w-[18px] text-[#f4f1ea]" />
          <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-[#f4f1ea]">
            Assay
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6f78] transition-colors hover:text-[#f4f1ea]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6f78] transition-colors hover:text-[#f4f1ea]"
          >
            Sign in
          </Link>
          <Link
            href="/try"
            className="rounded-[2px] bg-[#f4f1ea] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#08080a] transition-colors hover:bg-white"
          >
            Scan an app
          </Link>
        </div>
      </div>
    </header>
  );
}

export function FooterV2() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto max-w-[76rem] px-6 py-12 sm:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <HallmarkMark className="h-4 w-4 text-[#f4f1ea]" />
              <span className="font-display text-sm font-semibold text-[#f4f1ea]">
                Assay
              </span>
            </div>
            <p className="mt-3 max-w-[26ch] text-[13px] leading-relaxed text-[#6f6f78]">
              The independent security check for apps built with AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {[
              { href: "/pricing", label: "Pricing" },
              { href: "/docs", label: "Docs" },
              { href: "/watch", label: "Monitoring" },
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6f78] transition-colors hover:text-[#f4f1ea]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a52]">
          assaysecurity.com
        </p>
      </div>
    </footer>
  );
}
