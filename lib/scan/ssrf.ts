/** True if an IP literal is loopback/private/link-local. Pure — unit-tested. */
export function isPrivateIp(ip: string): boolean {
  const v4 = ip.includes(".") ? ip.split(".").map(Number) : null;
  if (v4 && v4.length === 4 && v4.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = v4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) || // link-local
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) // CGNAT
    );
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // unique-local
  if (v6.startsWith("fe80")) return true; // link-local
  const mapped = v6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

/**
 * True if a URL hostname is an IP address written in a non-standard numeric form
 * — bare decimal (`2130706433`), hex (`0x7f000001`), octal-prefixed octets
 * (`0177.0.0.1`), or a short/2-3 part form. These encodings all resolve to an
 * address but exist almost exclusively to slip a private/loopback target past a
 * dotted-decimal SSRF filter, so we reject them outright rather than trust the
 * resolver to normalize them (glibc does; musl and others may not). Pure —
 * unit-tested. Standard dotted-quad IPv4 (`a.b.c.d`) is NOT flagged here; it's
 * validated by isPrivateIp against the actual octets instead.
 */
export function isObfuscatedIpHost(host: string): boolean {
  const h = host.toLowerCase();
  // Bare decimal or hex integer (e.g. 2130706433, 0x7f000001).
  if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/.test(h)) return true;
  // Dotted numeric form where any octet uses hex (0x…) or octal (leading 0),
  // or the address has fewer than four parts (e.g. 127.1, 0177.0.0.1).
  const parts = h.split(".");
  const allNumericish = parts.every((p) => /^(0x[0-9a-f]+|\d+)$/.test(p) && p !== "");
  if (allNumericish && parts.length > 1) {
    if (parts.length < 4) return true; // short form
    return parts.some((p) => /^0x/.test(p) || (/^0\d+$/.test(p) && p !== "0"));
  }
  return false;
}
