import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildActivity } from "@/lib/monitor/activity";
import { agentChatReply, type ChatTurn } from "@/lib/anthropic/agent-chat";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Chat with the agent about ONE watched app. Auth-required; the monitor is
 * read through RLS so a user can only ever talk about their own apps. The
 * agent answers grounded in that app's real scan history + latest findings.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`agent-chat:${user.id}`, 20, 60_000).ok) {
    return NextResponse.json(
      { reply: "You're sending messages very fast — give me a few seconds and try again." },
    );
  }

  let body: { monitorId?: unknown; messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const monitorId = typeof body.monitorId === "string" ? body.monitorId : null;
  const turns: ChatTurn[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is { role: string; content: string } =>
            !!m && typeof m === "object" &&
            ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
            typeof (m as { content?: unknown }).content === "string",
        )
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 2000) }))
    : [];
  if (!monitorId || turns.length === 0) {
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

  const reply = await agentChatReply(
    {
      appUrl: monitor.app_url,
      latestScore: latest?.score ?? null,
      latestVerdict: latest?.verdict ?? null,
      events: buildActivity(history),
      findings: findings ?? [],
    },
    turns,
  );

  return NextResponse.json({ reply });
}
