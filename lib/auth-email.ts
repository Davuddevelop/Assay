/**
 * Email validation for the sign-in form.
 *
 * Pure and separate from the server action so it can be tested without pulling
 * in `server-only` — the same split the API-key and MCP modules use.
 *
 * Deliberately permissive about what an address may contain and strict about
 * shape. The goal is not to decide whether an address exists — only Supabase
 * sending to it can — but to refuse obvious junk before it costs an email, and
 * to refuse anything with a newline in it, which is what turns an address into
 * a header-injection attempt.
 */
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MAX_EMAIL_LENGTH = 254; // RFC 5321 practical maximum

export function looksLikeEmail(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const value = raw.trim();
  if (!value || value.length > MAX_EMAIL_LENGTH) return false;
  // Control characters — CR/LF above all — must never reach a mail pipeline.
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  return SHAPE.test(value);
}

/** Normalised form to send to the provider: trimmed and lowercased. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Shape check for the 6-digit sign-in code, the fallback for when the emailed
 * link gets consumed before the user clicks it — some corporate mail gateways
 * and security scanners pre-fetch every link in an email to scan it, which
 * silently burns the one-time token. A typed code has no URL for that kind of
 * thing to visit, so it survives where the link doesn't.
 *
 * Shape only, same as the email check: whether it's the *right* code is
 * Supabase's problem when we call verifyOtp.
 */
const CODE_SHAPE = /^\d{6}$/;

export function looksLikeOtpCode(raw: unknown): raw is string {
  return typeof raw === "string" && CODE_SHAPE.test(raw.trim());
}

/** Strips whitespace someone pastes in around the digits. */
export function normalizeOtpCode(raw: string): string {
  return raw.trim();
}
