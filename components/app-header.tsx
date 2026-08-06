import { MobileMenu } from "@/components/mobile-menu";
import { NavBar } from "@/components/nav-bar";
import { SignOutButton } from "@/components/sign-out-button";
import { getUser, toSessionUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scan", label: "New scan" },
  { href: "/billing", label: "Billing" },
  { href: "/settings/keys", label: "API keys" },
];

/**
 * Chrome for signed-in pages. Same bar as the marketing site — the dashboard
 * gets the same design bar as the marketing pages (CLAUDE.md §6), and two
 * different navs on one product is how an app starts feeling like two
 * products.
 */
export async function AppHeader() {
  const user = await getUser();
  const session = user ? toSessionUser(user) : null;

  return (
    <NavBar homeHref="/dashboard" homeLabel="Assay dashboard" links={LINKS}>
      {/* The account chip lost its capsule and its fill. It was a bordered,
          filled pill sitting beside a bordered, filled nav — two containers
          for one avatar and a handle. Avatar and name, on the bar. */}
      <span className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-surface font-mono text-xs text-ash">
          {session?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            session?.initial ?? "?"
          )}
        </span>
        <span className="hidden font-mono text-xs text-ivory-dim sm:inline">
          {session?.handle ?? "guest"}
        </span>
      </span>
      {session && (
        <div className="ml-2 hidden md:block">
          <SignOutButton action={signOut} />
        </div>
      )}
      <MobileMenu
        links={LINKS}
        footer={session ? <SignOutButton action={signOut} /> : undefined}
      />
    </NavBar>
  );
}
