import { describe, it, expect } from "vitest";

import { chunkFile, chunkFiles, isSkippablePath } from "@/lib/embeddings/chunk";

describe("chunkFile", () => {
  it("returns a single chunk for a small file", () => {
    const chunks = chunkFile("a.ts", "line1\nline2\nline3");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[0].path).toBe("a.ts");
  });

  it("splits long files into overlapping windows", () => {
    const content = Array.from({ length: 150 }, (_, i) => `line${i + 1}`).join("\n");
    const chunks = chunkFile("big.ts", content, { maxLines: 60, overlap: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    // step = 50, so the second window starts at line 51
    expect(chunks[1].startLine).toBe(51);
    // overlap: first ends at 60, second starts at 51
    expect(chunks[0].endLine).toBe(60);
  });

  it("skips empty and oversized files", () => {
    expect(chunkFile("e.ts", "   ")).toEqual([]);
    expect(chunkFile("e.ts", "x".repeat(10), { maxFileChars: 5 })).toEqual([]);
  });
});

describe("isSkippablePath", () => {
  it("skips deps, builds, locks, and binaries", () => {
    expect(isSkippablePath("node_modules/react/index.js")).toBe(true);
    expect(isSkippablePath("dist/app.js")).toBe(true);
    expect(isSkippablePath("package-lock.json")).toBe(true);
    expect(isSkippablePath("logo.png")).toBe(true);
  });
  it("keeps real source files", () => {
    expect(isSkippablePath("src/lib/auth.ts")).toBe(false);
  });
});

describe("chunkFiles", () => {
  it("filters skippable paths before chunking", () => {
    const chunks = chunkFiles([
      { path: "src/a.ts", content: "const a = 1" },
      { path: "node_modules/x/y.js", content: "junk" },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].path).toBe("src/a.ts");
  });
});
