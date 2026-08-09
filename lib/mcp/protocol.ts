/**
 * The wire shapes for Model Context Protocol over HTTP — pure, so the protocol
 * layer is unit-testable without a request.
 *
 * MCP is JSON-RPC 2.0. We implement it directly rather than take a dependency,
 * matching how the Lemon Squeezy and Resend clients in this codebase are
 * written: the surface we need is three methods wide, and a protocol library
 * that churns is a build break waiting to happen on a path other people's
 * agents depend on.
 */
export const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "assay", version: "1.0.0" } as const;

/** JSON-RPC error codes we can emit. */
export const RPC = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalError: -32603,
} as const;

export interface RpcRequest {
  jsonrpc: "2.0";
  /** Absent on notifications, which take no response. */
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export type RpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string } };

/** Validate an incoming payload. Pure. */
export function parseRpc(body: unknown): RpcRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (b.jsonrpc !== "2.0" || typeof b.method !== "string") return null;
  const id = b.id;
  if (id !== undefined && id !== null && typeof id !== "string" && typeof id !== "number") {
    return null;
  }
  return {
    jsonrpc: "2.0",
    id: id as string | number | null | undefined,
    method: b.method,
    params:
      b.params && typeof b.params === "object"
        ? (b.params as Record<string, unknown>)
        : undefined,
  };
}

/** A notification expects no reply — the caller returns 202 with no body. */
export function isNotification(req: RpcRequest): boolean {
  return req.id === undefined || req.id === null;
}

export function rpcResult(id: string | number | null, result: unknown): RpcResponse {
  return { jsonrpc: "2.0", id, result };
}

export function rpcError(
  id: string | number | null,
  code: number,
  message: string,
): RpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

/** The `initialize` handshake result. Pure. */
export function initializeResult() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    // Tools only: Assay answers questions, it does not serve prompts or
    // resources, and claiming capabilities we don't implement makes clients
    // probe endpoints that aren't there.
    capabilities: { tools: {} },
    serverInfo: SERVER_INFO,
  };
}

/**
 * Wrap a plain-text answer as an MCP tool result. `isError` tells the calling
 * agent the tool ran but failed, which is different from a protocol error.
 */
export function toolResult(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}
