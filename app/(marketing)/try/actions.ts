"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PREFILL_COOKIE, PREFILL_MAX_AGE, isPrefillable } from "@/lib/scan/prefill";

/**
 * Leave the anonymous report and sign in, holding onto the app that was just
 * scanned so the next screen is already filled in.
 */
export async function continueWithApp(formData: FormData) {
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
