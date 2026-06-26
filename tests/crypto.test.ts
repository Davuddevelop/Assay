import { describe, it, expect, beforeAll } from "vitest";

// AES-256-GCM needs a 32-byte key as 64 hex chars. Set before importing crypto,
// which reads it lazily through getEnv().
beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
});

describe("crypto: encrypt/decrypt", () => {
  it("round-trips a token", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const secret = "ghs_exampleInstallationToken1234567890";
    const ct = encrypt(secret);
    expect(ct).not.toContain(secret);
    expect(ct.startsWith("v1.")).toBe(true);
    expect(decrypt(ct)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects a tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const ct = encrypt("payload");
    const parts = ct.split(".");
    // Flip a hex digit in the ciphertext segment.
    const flipped = parts[3][0] === "0" ? "1" : "0";
    parts[3] = flipped + parts[3].slice(1);
    expect(() => decrypt(parts.join("."))).toThrow();
  });

  it("rejects a malformed token", async () => {
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt("not-a-valid-token")).toThrow("Malformed");
  });
});
