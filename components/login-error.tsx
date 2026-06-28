"use client";

import { useSearchParams } from "next/navigation";

/** Reads the `?error=` param client-side so the login page can stay static. */
export function LoginError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p className="mt-6 w-full rounded-[var(--radius-control)] border border-oxblood/50 bg-oxblood/10 px-4 py-3 text-sm text-oxblood-soft">
      Sign-in didn&rsquo;t complete. Please try again.
    </p>
  );
}
