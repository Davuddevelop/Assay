import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * Authenticated symmetric encryption for secrets at rest (GitHub installation
 * tokens). AES-256-GCM with a random 96-bit IV per message and the 128-bit
 * auth tag, so tampering is detected on decrypt.
 *
 * Stored format (a single string, safe for a text column):
 *   v1.<iv-hex>.<authTag-hex>.<ciphertext-hex>
 *
 * The key comes from `ENCRYPTION_KEY` (32 bytes / 64 hex chars). Rotating the
 * key invalidates existing ciphertexts — re-encrypt on rotation.
 */
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

function key(): Buffer {
  // Read ENCRYPTION_KEY directly so the cipher has no dependency on the rest
  // of the env being populated. 64 hex chars -> 32 bytes for AES-256.
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  }
  return Buffer.from(raw, "hex");
}

/** Encrypt a UTF-8 plaintext. Returns an opaque, versioned token string. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("hex"),
    authTag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(".");
}

/** Decrypt a token produced by {@link encrypt}. Throws if tampered or malformed. */
export function decrypt(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Malformed ciphertext");
  }
  const [, ivHex, tagHex, dataHex] = parts;
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
