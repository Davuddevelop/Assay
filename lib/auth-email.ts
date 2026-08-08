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
 * Shape check for the emailed sign-in code — the only way email sign-in
 * finishes. Chosen over a clickable link because some mail gateways and
 * security scanners pre-fetch every link in an email to scan it and silently
 * burn the one-time token. A typed code has no URL for that to visit.
 *
 * Six to ten digits, not six. Supabase's OTP length is configurable in that
 * range and the *default varies by when the project was provisioned* — ours
 * issues eight. Hardcoding six rejected every real code before it reached
 * verifyOtp; hardcoding eight would just move the same bug. Accept the whole
 * documented range and let Supabase judge the value.
 *
 * Shape only, same as the email check: whether it's the *right* code is
 * Supabase's problem when we call verifyOtp.
 */
export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 10;

const CODE_SHAPE = new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`);

export function looksLikeOtpCode(raw: unknown): raw is string {
  return typeof raw === "string" && CODE_SHAPE.test(raw.trim());
}

/** Strips whitespace someone pastes in around the digits. */
export function normalizeOtpCode(raw: string): string {
  return raw.trim();
}

/**
 * Carrying the address across the send → check-your-email → type-the-code trip.
 *
 * verifyOtp needs the email alongside the code, and without this the form asks
 * for an address the person typed thirty seconds ago on the same page. That
 * retype is friction at precisely the moment they're already annoyed the link
 * didn't work.
 *
 * A short-lived httpOnly cookie rather than a query parameter, matching
 * PREFILL_COOKIE: an address in the URL ends up in browser history, server
 * logs and any Referer header the page emits, and it would let a crafted link
 * pre-fill someone else's sign-in form with an address of the attacker's
 * choosing.
 */
export const PENDING_EMAIL_COOKIE = "assay_pending_email";

/** Ten minutes — comfortably longer than it takes to open an email, and gone soon after. */
export const PENDING_EMAIL_MAX_AGE = 60 * 10;
