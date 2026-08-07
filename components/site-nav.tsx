import { NavAccount } from "@/components/nav-account";
import { MobileMenu } from "@/components/mobile-menu";
import { NavBar } from "@/components/nav-bar";

const LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  // The beachhead (CLAUDE.md §10), and until now reachable from the footer
  // and nowhere else. A page that is the narrow wedge the whole strategy
  // rests on cannot be the one link a visitor has to scroll past everything
  // to find — especially when the person it is written for, a freelancer
  // about to invoice, is the one visitor who would pay.
  { href: "/client-handoff", label: "Client work" },
  // Continuous monitoring is the only thing we charge for, so the page that
  // explains it belongs in the nav — it was previously reachable only from the
  // sitemap.
  { href: "/watch", label: "Monitoring" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

/** Marketing chrome — see components/nav-bar.tsx for the shape and why. */
export function SiteNav() {
  return (
    <NavBar homeHref="/" homeLabel="Assay home" links={LINKS}>
      <NavAccount />
      <MobileMenu links={LINKS} />
    </NavBar>
  );
}
