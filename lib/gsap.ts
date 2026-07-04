"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Single GSAP entry point for the app. Registers the plugins exactly once and
 * re-exports them so components share one registration.
 *
 * - `useGSAP` (from @gsap/react) runs at layout-effect timing on the client and
 *   reverts every animation/ScrollTrigger it creates on unmount — no SSR calls,
 *   no leaks, no flash of the pre-animation state.
 * - After web fonts load, refresh ScrollTrigger so trigger positions account for
 *   the final text metrics (the skill's "refresh after fonts/layout" rule).
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

export { gsap, useGSAP };
