import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildActivity } from "@/lib/monitor/activity";
import { agentChatReply, type ChatTurn } from "@/lib/anthropic/agent-chat";
import { consumeRateLimit } from "@/lib/rate-limit-global";
import { loadConversation, appendExchange } from "@/lib/data/agent-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The agent can now take several passes — look something up, act on it, then
// answer — and a re-check makes a live request to the app in between. That
// needs more headroom than a single completion did.
export const maxDuration = 60;

/**
 * Chat with the agent about ONE watched app. Auth-required; the monitor is
 * read through RLS so a user can only ever talk about their own apps. The
 * agent answers grounded in that app's real scan history + latest findings.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Global across instances — each call hits the Anthropic API (real cost), so
  // the per-instance in-memory limiter alone isn't a sufficient abuse guard.
  if (!(await consumeRateLimit(`agent-chat:${user.id}`, 20, 60))) {
    return NextResponse.json(
      { reply: "You're sending messages very fast — give me a few seconds and try again." },
      { status: 429 },
    );
  }

  let body: { monitorId?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const monitorId = typeof body.monitorId === "string" ? body.monitorId : null;
  // Only the NEW message comes from the client now. The rest of the
  // conversation is loaded server-side below — which is what lets it survive a
  // refresh, and also closes the door on a client forging assistant turns to
  // put words in the agent's mouth.
  const message = typeof body.message === "string" ? body.message.slice(0, 2000).trim() : "";
  if (!monitorId || !message) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // RLS scopes this read — a monitor id belonging to someone else returns null.
  const db = await createClient();
  const { data: monitor } = await db
    .from("monitored_apps")
    .select("*")
    .eq("id", monitorId)
    .maybeSingle();
  if (!monitor) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: scans } = await db
    .from("scans")
    .select("*")
    .eq("app_url", monitor.app_url)
    .eq("status", "completed")
    .order("completed_at", { ascending: true })
    .limit(30);
  const history = (scans ?? []).map((s) => ({
    id: s.id,
    at: s.completed_at ?? s.created_at,
    score: s.score,
    verdict: s.verdict,
  }));
  const latest = history[history.length - 1];

  const latestScanId = (scans ?? [])[history.length - 1]?.id;
  const { data: findings } = latestScanId
    ? await db
        .from("scan_findings")
        .select("severity, title, plain_explanation")
        .eq("scan_id", latestScanId)
        .order("severity")
    : { data: [] };

  // Everything the agent remembers about this app, plus what was just said.
  const past = await loadConversation(monitorId);
  const turns: ChatTurn[] = [...past, { role: "user", content: message }];

  const reply = await agentChatReply(
    {
      appUrl: monitor.app_url,
      latestScore: latest?.score ?? null,
      latestVerdict: latest?.verdict ?? null,
      events: buildActivity(history),
      findings: findings ?? [],
    },
    turns,
    // The agent's tools act on THIS app only. Both fields are taken from the
    // RLS-scoped monitor row resolved above — never from the request body — so
    // there is no path by which a crafted message could point a tool at
    // somebody else's app.
    { userId: user.id, appUrl: monitor.app_url },
  );

  // Remember the exchange. Best-effort by design — the answer is already
  // written, and losing the memory of one turn must not cost the user a reply.
  await appendExchange(user.id, monitorId, message, reply);

  return NextResponse.json({ reply });
}
