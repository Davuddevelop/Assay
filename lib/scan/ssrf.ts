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
