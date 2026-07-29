import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

/**
 * The agent's memory of one watched app.
 *
 * The conversation is owned by the server, not the browser. That's what makes
 * it survive a refresh — and it also means a client can't forge an assistant
 * turn to put words in the agent's mouth, which was possible while the whole
 * history arrived in the request body.
 *
 * Every function here degrades to "no memory" rather than throwing: if the
 * migration hasn't been applied, the agent should answer with a blank slate,
 * never fail the request.
 */
export interface StoredTurn {
  role: "user" | "assistant";
  content: string;
}

/** How much history the agent carries into a reply. */
const RECALL_TURNS = 24;
/** Hard cap per message, so one enormous paste can't dominate the context. */
const MAX_CONTENT = 4000;

/**
 * The recent conversation for this app, oldest first. Returns [] when there is
 * no history — or when the table doesn't exist yet.
 */
export async function loadConversation(monitorId: string): Promise<StoredTurn[]> {
  try {
    const db = createAdminClient();
    // Newest-first with a limit gets the most RECENT window; reversed after,
    // because the model needs them in the order they were said.
    const { data, error } = await db
      .from("agent_messages")
      .select("role, content")
      .eq("monitor_id", monitorId)
      .order("created_at", { ascending: false })
      .limit(RECALL_TURNS);
    if (error) {
      log.warn("agent memory unavailable", { reason: error.message });
      return [];
    }
    return ((data ?? []) as StoredTurn[]).reverse();
  } catch (err) {
    log.warn("agent memory read failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return [];
  }
}

/**
 * Append both sides of a completed exchange. Best-effort: a failure here costs
 * the agent its memory of this turn, which must never cost the user their
 * answer — the reply has already been produced by the time we're called.
 */
export async function appendExchange(
  userId: string,
  monitorId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("agent_messages").insert([
      {
        user_id: userId,
        monitor_id: monitorId,
        role: "user",
        content: userMessage.slice(0, MAX_CONTENT),
      },
      {
        user_id: userId,
        monitor_id: monitorId,
        role: "assistant",
        content: assistantMessage.slice(0, MAX_CONTENT),
      },
    ]);
    if (error) log.warn("agent memory write failed", { reason: error.message });
  } catch (err) {
    log.warn("agent memory write failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}
