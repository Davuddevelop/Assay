"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { useToast } from "@/components/ui/toast";

/**
 * Opens the Paddle checkout overlay.
 *
 * Paddle Billing has no hosted checkout page. Creating a transaction with a
 * default payment link configured returns *our own* URL with `?_ptxn=<id>`
 * appended — the payment UI itself is an overlay that only Paddle.js can draw.
 * Without this component the server action redirects here and nothing happens,
 * which is precisely what it did.
 *
 * The transaction is still created server-side, so the price being charged is
 * decided by the server and arrives here as an opaque id. Nothing about what
 * is billed can be altered from the browser.
 */

interface PaddleCheckout {
  Environment: { set(env: string): void };
  Initialize(opts: { token: string }): void;
  Checkout: { open(opts: { transactionId: string }): void };
}

declare global {
  interface Window {
    Paddle?: PaddleCheckout;
  }
}

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

export function PaddleCheckout() {
  const params = useSearchParams();
  const txn = params.get("_ptxn");
  const { notify } = useToast();
  // React can run an effect twice in development; opening two overlays for one
  // transaction is confusing, so the id we've handled is remembered.
  const opened = useRef<string | null>(null);

  useEffect(() => {
    if (!txn || opened.current === txn) return;
    const token = publicEnv.paddleClientToken;
    if (!token) {
      notify({
        title: "Checkout isn't available",
        message: "Payments aren't fully configured yet. Nothing was charged.",
        tone: "warn",
      });
      return;
    }
    opened.current = txn;

    function open() {
      const paddle = window.Paddle;
      if (!paddle) return;
      // Sandbox must be set before Initialize, or the token is rejected.
      if (publicEnv.paddleEnv === "sandbox") paddle.Environment.set("sandbox");
      paddle.Initialize({ token });
      paddle.Checkout.open({ transactionId: txn! });
    }

    if (window.Paddle) {
      open();
      return;
    }

    // Load Paddle.js only when a checkout is actually being opened, so the
    // billing page costs nothing extra to visit.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PADDLE_JS}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => open();
    const onError = () =>
      notify({
        title: "Couldn't open checkout",
        message: "Check your connection and try again. Nothing was charged.",
        tone: "warn",
      });

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    if (!existing) {
      script.src = PADDLE_JS;
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [txn, notify]);

  return null;
}
