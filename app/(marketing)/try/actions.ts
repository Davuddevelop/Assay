"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PREFILL_COOKIE, PREFILL_MAX_AGE, isPrefillable } from "@/lib/scan/prefill";
import { recordFunnelEvent } from "@/lib/data/funnel";

/**
 * Leave the anonymous report and sign in, holding onto the app that was just
 * scanned so the next screen is already filled in.
 */
export async function continueWithApp(formData: FormData) {
  // The fork in the diagnosis. If this stays near zero, the report's ask is
  // wrong; if it's healthy and signups aren't, the sign-in wall is. Those need
  // opposite fixes and there was no way to tell them apart.
  recordFunnelEvent("cta_click");

  const url = String(formData.get("url") ?? "");
  if (isPrefillable(url)) {
    (await cookies()).set(PREFILL_COOKIE, url, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PREFILL_MAX_AGE,
    });
  }
  redirect("/login");
}
