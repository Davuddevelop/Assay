"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { SESSION_HINT_COOKIE } from "@/lib/request-path";

/**
 * The account pill on marketing pages.
 *
 * These pages are statically prerendered, which is what makes them fast and
 * indexable and is worth keeping. A static document is built once and served
 * to everyone, so it cannot know who is asking — and the nav used to simply
 * hardcode "Sign in". A signed-in person browsing pricing or docs was told to
 * sign in, and had no route back into the app from any marketing page.
 *
 * The session itself can't be read here: the auth cookie is `httpOnly` on
 * purpose, so that an XSS can't exfiltrate it. Middleware therefore leaves a
 * separate, non-secret flag saying a session exists, and this reads that.
 *
 * `useSyncExternalStore` rather than an effect: the cookie is external mutable
 * state, and this is the hook that exists for reading one without tearing. The
 * server snapshot is `false`, so the prerendered HTML says "Sign in" — correct
 * for most visitors — and hydration corrects it for the rest.
 */

/** The cookie never emits events, so there is nothing to subscribe to. */
function subscribe(): () => void {
  return () => {};
}

function hasSessionCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${SESSION_HINT_COOKIE}=1`));
}

export function NavAccount() {
  const signedIn = useSyncExternalStore(subscribe, hasSessionCookie, () => false);

  return signedIn ? (
    <Button href="/dashboard" variant="primary" size="sm">
      Dashboard
    </Button>
  ) : (
    <Button href="/login" variant="primary" size="sm">
      Sign in
    </Button>
  );
}
