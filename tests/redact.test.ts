import { describe, it, expect } from "vitest";

import {
  redactEmail,
  redactPhone,
  redactToken,
  redactName,
  redactValue,
  redactRow,
} from "@/lib/scan/redact";

// The safety of the whole proof-of-exposure feature lives in this file, so the
// governing property is tested directly: no redaction may return enough to
// contact or identify a real person. Concretely — the raw local part of an
// email, a full phone number, or a whole token must never survive.

describe("redactEmail", () => {
  it("keeps one initial and the full domain", () => {
    expect(redactEmail("konstantin@gmail.com")).toBe("k••••@gmail.com");
  });

  it("never reveals the local part beyond the first character", () => {
    const out = redactEmail("alexandra@icloud.com");
    expect(out.startsWith("a")).toBe(true);
    expect(out).not.toContain("lexandra");
    expect(out.endsWith("@icloud.com")).toBe(true);
  });

  it("collapses malformed emails to bullets rather than passing them through", () => {
    expect(redactEmail("not-an-email")).not.toContain("not-an-email");
    expect(redactEmail("a@b")).not.toContain("@"); // no TLD → not shown as email
  });
});

describe("redactPhone", () => {
  it("keeps a country lead and the last two digits, fixed-width middle", () => {
    expect(redactPhone("+994 50 123 45 67")).toBe("+9945 ••• 67");
  });

  it("never contains the full digit run", () => {
    const out = redactPhone("+994501234567");
    expect(out).not.toContain("501234567");
    expect(out).not.toContain("1234567");
  });

  it("masks anything too short to be a real number", () => {
    expect(redactPhone("12345")).not.toContain("12345");
  });
});

describe("redactToken", () => {
  it("keeps only the first four and last two characters", () => {
    expect(redactToken("sk_live_abcdef123456")).toBe("sk_l••••••56");
  });

  it("never leaves a usable secret", () => {
    const secret = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const out = redactToken(secret);
    expect(out).not.toContain("IUzI1NiIs");
    expect(out.length).toBeLessThan(secret.length);
  });
});

describe("redactName", () => {
  it("reduces each word to an initial", () => {
    expect(redactName("Ada Lovelace")).toBe("A•••• L••••");
  });
});

describe("redactValue dispatches on shape, not just column name", () => {
  it("redacts an email in any column as an email", () => {
    expect(redactValue("username", "real@person.com")).toBe("r••••@person.com");
  });

  it("redacts a UUID sitting in an 'email' column as a token, not an email", () => {
    const out = redactValue("email", "550e8400-e29b-41d4-a716-446655440000");
    expect(out).not.toContain("@");
    expect(out.startsWith("550e")).toBe(true);
  });

  it("shows only that a value exists for numbers and booleans", () => {
    expect(redactValue("balance", 4820.55)).not.toContain("4820");
    expect(redactValue("is_admin", true)).not.toContain("true");
  });

  it("collapses null/empty to a single present-but-hidden marker", () => {
    expect(redactValue("x", null)).toBe("•");
    expect(redactValue("x", "")).toBe("•");
  });

  it("masks unknown free text to almost nothing", () => {
    const out = redactValue("bio", "I was born in 1990 in Baku and my SSN is");
    expect(out).not.toContain("1990");
    expect(out).not.toContain("Baku");
    expect(out.length).toBeLessThan(8);
  });
});

describe("redactRow", () => {
  const row = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "konstantin@gmail.com",
    phone: "+994501234567",
    full_name: "Konstantin Popov",
    created_at: "2024-01-14T00:00:00Z",
    is_admin: false,
  };

  it("shows the sensitive columns first, capped", () => {
    const out = redactRow(row, ["email", "phone", "full_name"], 4);
    expect(out).toHaveLength(4);
    expect(out.slice(0, 3).map((c) => c.column)).toEqual(["email", "phone", "full_name"]);
  });

  it("redacts every cell — no raw PII survives anywhere in the output", () => {
    const out = redactRow(row, ["email", "phone", "full_name"], 6);
    const blob = JSON.stringify(out);
    expect(blob).not.toContain("konstantin");
    expect(blob).not.toContain("501234567");
    expect(blob).not.toContain("Popov");
    expect(blob).not.toContain("446655440000");
  });

  it("still keeps enough shape to read as real data", () => {
    const out = redactRow(row, ["email"], 1);
    expect(out[0].value).toContain("@gmail.com");
  });
});
