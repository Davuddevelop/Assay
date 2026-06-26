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

const MAX_STRING = 256;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") {
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
