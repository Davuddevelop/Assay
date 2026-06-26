import { describe, it, expect } from "vitest";

import { _redact } from "@/lib/log";

describe("log: redaction", () => {
  it("redacts sensitive keys", () => {
    const out = _redact({
      token: "ghs_secret",
      api_key: "sk-ant-xxx",
      webhook_secret: "shh",
      user: "davud",
    }) as Record<string, unknown>;
    expect(out.token).toBe("[redacted]");
    expect(out.api_key).toBe("[redacted]");
    expect(out.webhook_secret).toBe("[redacted]");
    expect(out.user).toBe("davud");
  });

  it("redacts user code/diff fields", () => {
    const out = _redact({
      diff: "@@ -1 +1 @@\n-secret\n+secret",
      patch: "...",
      content: "source code here",
    }) as Record<string, unknown>;
    expect(out.diff).toBe("[redacted]");
    expect(out.patch).toBe("[redacted]");
    expect(out.content).toBe("[redacted]");
  });

  it("redacts nested sensitive keys", () => {
    const out = _redact({
      install: { account: "acme", encrypted_token: "v1.aa.bb.cc" },
    }) as { install: Record<string, unknown> };
    expect(out.install.account).toBe("acme");
    expect(out.install.encrypted_token).toBe("[redacted]");
  });

  it("truncates long strings", () => {
    const long = "x".repeat(1000);
    const out = _redact({ note: long }) as Record<string, unknown>;
    expect(String(out.note).length).toBeLessThan(300);
    expect(String(out.note)).toContain("[1000 chars]");
  });
});
