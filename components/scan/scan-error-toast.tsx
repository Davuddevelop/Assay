"use client";

import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";

/**
 * Surfaces a scan-submit rejection (from the `?error=` param) as a prominent
 * top-of-screen notification, not just a line of text under the form. The
 * inline message stays as a no-JS fallback; this fires once on mount when the
 * page loads with an error.
 */
export function ScanErrorToast({ error }: { error?: string }) {
  const { notify } = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !error) return;
    fired.current = true;

    if (error === "limit") {
      notify({
        tone: "warn",
        title: "You've used every scan this month",
        message:
          "You've hit the free monthly scan limit. Upgrade for more scans and continuous monitoring.",
        action: { label: "See plans", href: "/pricing" },
        duration: 9000,
      });
    } else if (error === "burst") {
      notify({
        tone: "warn",
        title: "Slow down a moment",
        message: "You're scanning too fast. Wait a minute and try again.",
        duration: 6000,
      });
    } else if (error === "url") {
      notify({
        tone: "warn",
        title: "That URL didn't look right",
        message: "Paste the full public link to the app you want to scan.",
        duration: 6000,
      });
    }
  }, [error, notify]);

  return null;
}
