import { NextResponse, type NextRequest } from "next/server";

import { bearerFrom, userIdForApiKey } from "@/lib/api-keys";
import { consumeRateLimit } from "@/lib/rate-limit-global";
import { MCP_TOOLS, runMcpTool } from "@/lib/mcp/tools";
import {
  parseRpc,
  isNotification,
  rpcResult,
  rpcError,
  initializeResult,
  toolResult,
  RPC,
} from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A real scan runs inside this request — the same budget the web scan gets.
export const maxDuration = 60;

/**
 * Assay as a Model Context Protocol server.
 *
 * The point of the whole product is a check that happens BEFORE an app ships.
 * Until now that required the person to leave what they were building, visit a
 * website, and carry a fix prompt back by hand — a human acting as an API call
 * between two models. This endpoint lets the agent they are already working
 * with ask directly: "is this safe to deploy?"
 *
 * Auth is a bearer API key, because the clients here — an editor, a coding
 * agent, an MCP host — have no session cookie.
 */
export async function POST(req: NextRequest) {
  const key = bearerFrom(req.headers.get("authorization"));
  if (!key) {
    return NextResponse.json(
      rpcError(null, RPC.invalidRequest, "Missing bearer API key."),
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  const userId = await userIdForApiKey(key);
  if (!userId) {
    return NextResponse.json(
      rpcError(null, RPC.invalidRequest, "Invalid or revoked API key."),
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, RPC.parseError, "Invalid JSON."), { status: 400 });
  }

  const rpc = parseRpc(body);
  if (!rpc) {
    return NextResponse.json(
      rpcError(null, RPC.invalidRequest, "Not a valid JSON-RPC 2.0 request."),
      { status: 400 },
    );
  }

  // Notifications (no id) get no body — `notifications/initialized` is the one
  // every client sends right after the handshake.
  if (isNotification(rpc)) return new NextResponse(null, { status: 202 });
  const id = rpc.id ?? null;

  switch (rpc.method) {
    case "initialize":
      return NextResponse.json(rpcResult(id, initializeResult()));

    case "ping":
      return NextResponse.json(rpcResult(id, {}));

    case "tools/list":
      return NextResponse.json(rpcResult(id, { tools: MCP_TOOLS }));

    case "tools/call": {
      const name = typeof rpc.params?.name === "string" ? rpc.params.name : "";
      const args =
        rpc.params?.arguments && typeof rpc.params.arguments === "object"
          ? (rpc.params.arguments as Record<string, unknown>)
          : {};
      if (!name) {
        return NextResponse.json(rpcError(id, RPC.invalidParams, "Missing tool name."));
      }

      // A scan is the expensive path and this endpoint is reachable by anything
      // holding a key, so it is bounded per account on top of the plan meter.
      if (!(await consumeRateLimit(`mcp:${userId}`, 20, 60))) {
        return NextResponse.json(
          rpcResult(id, toolResult("Too many requests — wait a moment and try again.", true)),
        );
      }

      const out = await runMcpTool(userId, name, args);
      return NextResponse.json(rpcResult(id, toolResult(out.text, out.isError)));
    }

    default:
      return NextResponse.json(
        rpcError(id, RPC.methodNotFound, `Unsupported method: ${rpc.method}`),
      );
  }
}

/** Discovery: a GET tells a curious client what this endpoint is. */
export function GET() {
  return NextResponse.json({
    name: "assay",
    description: "The independent security check for AI-built apps, over MCP.",
    transport: "streamable-http",
    authentication: "Bearer API key — create one at https://assaysecurity.com/settings/keys",
    tools: MCP_TOOLS.map((t) => t.name),
  });
}
