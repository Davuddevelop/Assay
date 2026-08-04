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

  // The receipt is the one surface whose entire job is telling the truth about
  // what we touched, so the "0 rows read" line must go silent the moment a
  // check actually asked a database for records.
  describe("readRows", () => {
    it("is false when nothing touched a database", () => {
      expect(buildReceipt([]).readRows).toBe(false);
      expect(
        buildReceipt([{ kind: "exposed-secret" }, { kind: "missing-header" }]).readRows,
      ).toBe(false);
      // Storage lists objects; it never reads a row out of a table.
      expect(buildReceipt([{ kind: "supabase-storage" }]).readRows).toBe(false);
    });

    it("is true for database findings even with no proof attached", () => {
      // Proof is in-memory only, so a saved report arrives with none. The kind
      // still means we asked the table for rows — it may just have been empty.
      expect(buildReceipt([{ kind: "supabase-rls" }]).readRows).toBe(true);
      expect(buildReceipt([{ kind: "firebase-rules" }]).readRows).toBe(true);
    });

    it("is true whenever a finding carries proof", () => {
      expect(
        buildReceipt([{ kind: "open-endpoint", proof: { table: "users", rowCount: 3, rows: [] } }])
          .readRows,
      ).toBe(true);
    });
  });
});
