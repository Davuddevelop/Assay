/**
 * Proof-of-exposure redaction.
 *
 * When the RLS probe pulls a real row out of an unprotected table, a list of
 * column names ("email, phone, stripe_customer_id are public") is a fact the
 * owner's eyes slide off. A partially-masked real value — their user's actual
 * email with the middle burned out — is a fact they cannot look away from.
 *
 * The whole safety of that move lives in this file. Every function here takes a
 * real value and returns something that PROVES the value was reachable while
 * revealing almost none of it. The rules, in order of importance:
 *
 *  1. Never return enough to identify or contact a real person.
 *  2. Always keep enough shape that the owner recognises it as real data —
 *     "@gmail.com", a phone's country code, the right number of digits.
 *  3. Redact by TYPE. An email masks differently from a phone from a UUID, so
 *     each keeps the part that reads as real and burns the part that identifies.
 *  4. Fail safe. An unrecognised value is masked to near-nothing, never passed
 *     through on the assumption it's harmless.
 *
 * Pure and total — no I/O, no throws — so it can be exhaustively tested, which
 * for this file is not optional.
 */

const BULLET = "•"; // • — the mask glyph

function mask(n: number): string {
  return BULLET.repeat(Math.max(0, n));
}

/** Keep the first `lead` chars, mask a fixed run, keep the last `tail`. */
function keepEnds(s: string, lead: number, tail: number, bullets = 4): string {
  if (s.length <= lead + tail) {
    // Too short to safely show both ends — show only the first char.
    return s.slice(0, 1) + mask(bullets);
  }
  return s.slice(0, lead) + mask(bullets) + s.slice(s.length - tail);
}

/**
 * Email → keep the first char of the local part and the full domain.
 * `konstantin@gmail.com` → `k••••@gmail.com`. The domain is kept because it's
 * what makes it land ("that's a real gmail address") and it identifies nobody.
 */
export function redactEmail(value: string): string {
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return mask(6);
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain.includes(".")) return mask(6);
  return `${local.slice(0, 1)}${mask(4)}@${domain}`;
}

/**
 * Phone → keep the country/area lead and the last two digits, mask the middle
 * to a fixed width regardless of length so the count can't leak the number.
 * `+994 50 123 45 67` → `+994 5•• ••• •• 67`. Digits only; formatting dropped.
 */
export function redactPhone(value: string): string {
  const plus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return mask(6);
  const lead = digits.slice(0, plus ? 4 : 2);
  const tail = digits.slice(-2);
  return `${plus ? "+" : ""}${lead} ${mask(3)} ${tail}`;
}

/**
 * UUID / token / long opaque id → first 4 and last 2, everything else burned.
 * Proves a real key was there without handing over a usable one.
 */
export function redactToken(value: string): string {
  const s = value.trim();
  if (s.length <= 8) return s.slice(0, 2) + mask(4);
  return keepEnds(s, 4, 2, 6);
}

/** A person's name → first initial only. `Konstantin` → `K••••`. */
export function redactName(value: string): string {
  const s = value.trim();
  if (!s) return mask(4);
  // Each word to its initial, so "Ada Lovelace" → "A•••• L••••".
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.slice(0, 1) + mask(4))
    .join(" ");
}

/** Free text / anything else → keep the first char only. Failsafe default. */
function redactGeneric(value: string): string {
  const s = value.trim();
  if (!s) return mask(4);
  return s.slice(0, 1) + mask(5);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_ID_RE = /^[A-Za-z0-9_-]{16,}$/;

/** Column-name hints, so we redact a `name` field as a name even if it's text. */
const NAME_COL = /name|first|last|full[_-]?name|display/i;
const SECRET_COL = /token|secret|key|password|hash|api/i;

/**
 * Redact one value using both its column name and its own shape. The column
 * name is a hint; the value's shape is the authority (an `email` column holding
 * a UUID is redacted as a UUID). Non-strings and null/empty collapse to a
 * single glyph — a present-but-hidden marker, never the real value.
 */
export function redactValue(column: string, value: unknown): string {
  if (value === null || value === undefined) return mask(1);
  if (typeof value === "boolean" || typeof value === "number") {
    // Numbers and flags aren't PII on their own, but a raw balance or count
    // still shouldn't be quoted back; show only that a value exists.
    return mask(3);
  }
  if (typeof value !== "string") return mask(3);

  const s = value.trim();
  if (!s) return mask(1);

  // Shape wins over column name.
  if (EMAIL_RE.test(s)) return redactEmail(s);
  if (UUID_RE.test(s)) return redactToken(s);
  if (PHONE_RE.test(s) && /\d{6,}/.test(s.replace(/\D/g, ""))) return redactPhone(s);
  if (SECRET_COL.test(column) || LONG_ID_RE.test(s)) return redactToken(s);
  if (NAME_COL.test(column)) return redactName(s);
  return redactGeneric(s);
}

export interface RedactedCell {
  column: string;
  value: string;
}

/**
 * Turn one leaked row into a redacted preview: the sensitive-looking columns
 * first, capped, each value masked by type. This is the object the report
 * renders as "here are real records we just pulled from your database."
 *
 * `preferred` (from sensitiveColumns) are shown first because they're the ones
 * that land; the cap keeps the proof small enough to never constitute a dump.
 */
export function redactRow(
  row: Record<string, unknown>,
  preferred: string[],
  maxCells = 4,
): RedactedCell[] {
  const cols = Object.keys(row);
  const ordered = [
    ...preferred.filter((c) => cols.includes(c)),
    ...cols.filter((c) => !preferred.includes(c)),
  ];
  return ordered.slice(0, maxCells).map((column) => ({
    column,
    value: redactValue(column, row[column]),
  }));
}
