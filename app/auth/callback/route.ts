import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { completeSignIn } from "@/lib/auth-complete";
import { safeNext } from "@/lib/safe-redirect";
import { PREFILL_COOKIE } from "@/lib/scan/prefill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth callback. Supabase redirects here with a `code`; we exchange it for a
 * session, claim any installations owned by this GitHub account, and send the
 * user to their destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Someone who signed in from an anonymous report is mid-task: send them to
  // the scan box, already holding the app they just scanned, not to an empty
  // dashboard that makes them start over.
  const carrying = request.cookies.has(PREFILL_COOKIE);
  const next = safeNext(searchParams.get("next"), carrying ? "/scan" : "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await completeSignIn(user, carrying);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
