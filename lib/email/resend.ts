import "server-only";

import { resendConfig } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Transactional email via Resend's REST API — no SDK dependency, matching the
 * rest of the codebase's dependency-light style. Two hard rules:
 *   - No-op (returns false) when Resend isn't configured, so the app runs fine
 *     with no email keys at all.
 *   - Never throws to the caller. A failed send must never fail a scan.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const cfg = resendConfig();
  if (!cfg) {
    log.info("email skipped: Resend not configured", { subject: msg.subject });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${cfg.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      log.error("email send failed", { status: res.status });
      return false;
    }
    return true;
  } catch {
    log.error("email send error", {});
    return false;
  }
}
