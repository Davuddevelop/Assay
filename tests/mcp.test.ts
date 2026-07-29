import { describe, it, expect } from "vitest";

import {
  parseRpc,
  isNotification,
  rpcResult,
  rpcError,
  initializeResult,
  toolResult,
  PROTOCOL_VERSION,
  RPC,
} from "@/lib/mcp/protocol";
import { MCP_TOOLS } from "@/lib/mcp/tool-defs";
import {
  looksLikeApiKey,
  hashApiKey,
  keyPrefix,
  generateApiKey,
  bearerFrom,
} from "@/lib/api-keys-core";

describe("MCP protocol framing", () => {
  it("accepts a well-formed request", () => {
    const req = parseRpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(req?.method).toBe("tools/list");
    expect(req?.id).toBe(1);
  });

  // Other people's agents speak to this endpoint. A malformed frame must be
  // rejected cleanly rather than half-interpreted.
  it("rejects anything that isn't JSON-RPC 2.0", () => {
    expect(parseRpc(null)).toBeNull();
    expect(parseRpc("hello")).toBeNull();
    expect(parseRpc({ method: "tools/list" })).toBeNull();
    expect(parseRpc({ jsonrpc: "1.0", method: "x" })).toBeNull();
    expect(parseRpc({ jsonrpc: "2.0" })).toBeNull();
    expect(parseRpc({ jsonrpc: "2.0", id: { bad: true }, method: "x" })).toBeNull();
  });

  // A notification takes no response. Replying to one is a protocol violation
  // that some clients treat as a hard error.
  it("identifies notifications, which get no reply", () => {
    expect(isNotification(parseRpc({ jsonrpc: "2.0", method: "notifications/initialized" })!)).toBe(
      true,
    );
    expect(isNotification(parseRpc({ jsonrpc: "2.0", id: 0, method: "ping" })!)).toBe(false);
  });

  it("echoes the request id on both success and failure", () => {
    expect(rpcResult(7, { ok: true })).toEqual({ jsonrpc: "2.0", id: 7, result: { ok: true } });
    const err = rpcError("abc", RPC.methodNotFound, "nope");
    expect(err).toMatchObject({ jsonrpc: "2.0", id: "abc", error: { code: -32601 } });
  });

  it("advertises only the capability it implements", () => {
    const init = initializeResult();
    expect(init.protocolVersion).toBe(PROTOCOL_VERSION);
    expect(init.capabilities).toEqual({ tools: {} });
    expect(init.serverInfo.name).toBe("assay");
  });

  it("marks failed tool calls as errors without breaking the frame", () => {
    const ok = toolResult("all good");
    expect(ok.isError).toBe(false);
    expect(ok.content[0]).toEqual({ type: "text", text: "all good" });
    expect(toolResult("nope", true).isError).toBe(true);
  });
});

describe("MCP tool schemas", () => {
  it("declares uniquely-named tools", () => {
    const names = MCP_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const tool of MCP_TOOLS) {
    it(`${tool.name} is well-formed and tells an agent when to call it`, () => {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(tool.description.length).toBeGreaterThan(80);
      expect(tool.inputSchema.type).toBe("object");
      for (const req of tool.inputSchema.required) {
        expect(Object.keys(tool.inputSchema.properties)).toContain(req);
      }
    });
  }
});

describe("API keys", () => {
  it("mints keys that pass their own format check", () => {
    for (let i = 0; i < 20; i++) expect(looksLikeApiKey(generateApiKey())).toBe(true);
  });

  it("mints a different key every time", () => {
    const keys = new Set(Array.from({ length: 50 }, generateApiKey));
    expect(keys.size).toBe(50);
  });

  it("rejects things that are not keys", () => {
    for (const bad of ["", "assay_sk_", "sk_live_abc", "assay_sk_short", "bearer token"]) {
      expect(looksLikeApiKey(bad)).toBe(false);
    }
  });

  it("hashes deterministically, and differently per key", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(hashApiKey(a)).toBe(hashApiKey(a));
    expect(hashApiKey(a)).not.toBe(hashApiKey(b));
    expect(hashApiKey(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  // The prefix is shown in the UI so a person can tell keys apart. It must
  // never be enough to reconstruct or brute-force the key it came from.
  it("shows a prefix that reveals almost nothing", () => {
    const key = generateApiKey();
    const shown = keyPrefix(key);
    expect(key.startsWith(shown)).toBe(true);
    expect(shown.length).toBeLessThan(key.length / 2);
    expect(looksLikeApiKey(shown)).toBe(false);
  });

  it("reads a bearer credential, and only a bearer credential", () => {
    expect(bearerFrom("Bearer abc123")).toBe("abc123");
    expect(bearerFrom("bearer abc123")).toBe("abc123");
    expect(bearerFrom(null)).toBeNull();
    expect(bearerFrom("abc123")).toBeNull();
    expect(bearerFrom("Basic abc123")).toBeNull();
    expect(bearerFrom("Bearer")).toBeNull();
  });
});
