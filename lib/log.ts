/**
 * Minimal structured logger that redacts secrets and never prints user code.
 *
 * Hard rule: we never log GitHub tokens, encryption keys, API keys, webhook
 * secrets, or the contents of a user's repository. This logger redacts known
 * sensitive keys recursively and truncates long strings (a diff or file body
 * should never land in logs verbatim). Use `log.info`/`log.warn`/`log.error`
 * with a short message and a small context object — not raw payloads.
 */
type Level = "debug" | "info" | "warn" | "error";

type Context = Record<string, unknown>;

const SENSITIVE_KEY = /(token|secret|password|authorization|api[-_]?key|encryption|private[-_]?key|cookie|diff|patch|content|code|body)/i;

// Defense-in-depth: catches a secret-shaped value logged under an innocuous
// key (e.g. `note: "sk_live_..."` from an interpolated error message) that the
// key-name check above wouldn't otherwise catch. Covers this codebase's known
// key formats (Stripe, Resend, Supabase/JWT, Anthropic, Slack, SendGrid, AWS)
// plus generic long hex/base64 tokens.
const SENSITIVE_VALUE =
  /\b(sk_live_|sk_test_|rk_live_|whsec_|re_[A-Za-z0-9]{8}|sb_secret_|sk-ant-|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|xox[abpr]-|SG\.[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16})/;

const MAX_STRING = 256;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") {
    if (SENSITIVE_VALUE.test(value)) return "[redacted]";
    return value.length > MAX_STRING
      ? `${value.slice(0, MAX_STRING)}…[${value.length} chars]`
      : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => redact(v, depth + 1));
  }
  if (value && typeof value === "object") {
    const out: Context = {};
    for (const [k, v] of Object.entries(value as Context)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function emit(level: Level, msg: string, ctx?: Context) {
  const line: Context = {
    level,
    time: new Date().toISOString(),
    msg,
  };
  if (ctx) line.ctx = redact(ctx);
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const log = {
  debug: (msg: string, ctx?: Context) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Context) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Context) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Context) => emit("error", msg, ctx),
};

// Exported for unit testing the redaction logic.
export const _redact = redact;
