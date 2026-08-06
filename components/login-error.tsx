"use client";

import { useSearchParams } from "next/navigation";

/**
 * Reads `?error=` / `?sent=` client-side so the login page can stay static.
 *
 * The message is per-cause on purpose: one generic "sign-in didn't complete"
 * told someone who mistyped their address, someone we throttled, and someone
 * whose OAuth round trip failed exactly the same useless thing.
 *
 * What it never does is distinguish "that address has an account" from "it
 * doesn't" — the send path reports success either way, because the difference
 * is an account-enumeration oracle.
 */
const MESSAGES: Record<string, string> = {
  email: "That address didn’t look right. Check it and try again.",
  throttled: "Too many sign-in emails from here. Wait a few minutes and try again.",
  oauth: "GitHub sign-in didn’t complete. Please try again.",
  // Reachable only from the GitHub OAuth callback now: the sign-in email
  // contains a code and no link, so there is no link left to expire.
  auth: "That sign-in didn’t complete. Try again, or use an email code instead.",
  code: "That code didn’t work — it may be wrong, expired, or already used. Check the email again, or request a new one.",
};

export function LoginError() {
  const params = useSearchParams();

  if (params.get("sent") === "1") {
    return (
      <div className="mt-6 w-full rounded-[var(--radius-control)] border border-iris/40 bg-iris/[0.07] px-4 py-3.5 text-left">
        <p className="text-sm font-medium text-ivory">Check your email.</p>
        <p className="mt-1 text-sm leading-relaxed text-ivory-dim">
          Enter the code from it below. It expires shortly and can only be
          used once.
        </p>
      </div>
    );
  }

  const error = params.get("error");
  if (!error) return null;
  return (
    <p className="mt-6 w-full rounded-[var(--radius-control)] border border-oxblood/50 bg-oxblood/10 px-4 py-3 text-sm text-oxblood-soft">
      {MESSAGES[error] ?? "Sign-in didn’t complete. Please try again."}
    </p>
  );
}
