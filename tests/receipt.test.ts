import { describe, it, expect } from "vitest";

import { buildReceipt } from "@/lib/scan/receipt";

describe("buildReceipt", () => {
  it("counts nothing for a clean scan", () => {
    const r = buildReceipt([]);
    expect(r.secretsSeen).toBe(0);
    expect(r.findingsKept).toBe(0);
  });

  it("counts exposed secrets separately from total findings kept", () => {
    const r = buildReceipt([
      { kind: "exposed-secret" },
      { kind: "exposed-secret" },
      { kind: "supabase-rls" },
      { kind: "missing-header" },
    ]);
    expect(r.secretsSeen).toBe(2);
    expect(r.findingsKept).toBe(4);
  });

  it("keeps findings that aren't secrets without counting them as secrets", () => {
    const r = buildReceipt([{ kind: "supabase-storage" }, { kind: "open-endpoint" }]);
    expect(r.secretsSeen).toBe(0);
    expect(r.findingsKept).toBe(2);
  });
});
