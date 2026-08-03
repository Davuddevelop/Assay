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
