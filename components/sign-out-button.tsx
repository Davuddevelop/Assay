"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/spinner";

function Inner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex items-center gap-1.5 rounded-pill px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory disabled:opacity-60"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "…" : "Sign out"}
    </button>
  );
}

/** Sign-out form with a pending state. `action` is the server action. */
export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <Inner />
    </form>
  );
}
