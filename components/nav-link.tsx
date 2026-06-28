"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** A nav link that highlights when its route is active. */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const base = href.split("#")[0];
  const active = base !== "" && base !== "/" && pathname.startsWith(base);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm transition-colors",
        active ? "text-ivory" : "text-ivory-dim hover:text-ivory",
      )}
    >
      {label}
    </Link>
  );
}
