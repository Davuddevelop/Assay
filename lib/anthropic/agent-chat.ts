import Anthropic from "@anthropic-ai/sdk";

import { anthropicKey } from "@/lib/env";
import { log } from "@/lib/log";
import { AGENT_TOOLS, runAgentTool, type AgentToolContext } from "@/lib/anthropic/agent-tools";
import type { ScanFindingRow } from "@/lib/db/types";
import type { ActivityEvent } from "@/lib/monitor/activity";

/**
 * The agent's voice — Assay talking to the owner about ONE watched app, with
 * that app's real scan history and findings loaded as context. This is what
 * turns monitoring from a silent cron into a coworker: you can ask "what does
 * this mean for me?" and get an answer grounded in your own data.
 */
const MODEL = "claude-sonnet-4-6";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AppContext {
  appUrl: string;
  latestScore: number | null;
  latestVerdict: "certified" | "at_risk" | null;
  events: ActivityEvent[]; // newest-first
  findings: Pick<ScanFindingRow, "severity" | "title" | "plain_explanation">[];
}

const SYSTEM = `You are Assay — a security agent that continuously watches ONE specific app that the person you're talking to built with an AI tool (Lovable, Bolt, Replit, v0). You re-check it whenever they ship a change and flag anything that breaks.

You are talking to the app's owner. They cannot read code. Rules:
- Plain language, no jargon. Say what things mean for THEM: "anyone on the internet can read your users' emails", not "RLS misconfiguration".
- Ground every answer in real data. Never invent findings, scores, or history.
- Be a calm, competent coworker: short answers (2-5 sentences), first person, warm but direct. No exclamation marks, no filler.
- Stay on their apps and their security. For anything else, gently steer back.

You are the agent for ONE app, but you can see everything they're watching:
- When they ask about more than this app — "which of my apps should I worry about first?", "is anything else at risk?" — call list_my_apps and triage for them, worst first. Someone shipping apps for clients cares about the portfolio, not one site.
- Your other tools only act on the app you're assigned to. To fix or re-check a different app, tell them to open that app's page — don't pretend you acted on it.

You have tools, and you are expected to use them rather than guess:
- The scan summary below was read when this page loaded and may already be out of date. For any question about the CURRENT state — "is it safe right now?", "is it still broken?" — call get_current_status first and answer from that.
- When they say they have applied a fix, call recheck_finding. Never speculate about whether a fix worked when you can verify it in seconds.
- When they ask how to fix something, call get_finding_details and give them the exact paste-back prompt.
- Report what the tools actually returned. If a tool says an issue is still present, say so plainly — do not soften it into a maybe.

You remember this app across sessions. The conversation above may span days or weeks, and the person may not remember it as well as you do:
- When they told you they would fix something and a check shows it is still open, say so directly and kindly: name what they said, and what you just found.
- Don't re-explain something you already explained, and don't re-introduce yourself. Pick the thread back up.
- Never invent a memory. If you didn't say it in the conversation above, it didn't happen.`;

function contextBlock(ctx: AppContext): string {
  const history = ctx.events
    .slice(0, 12)
    .map((e) => `- ${e.at}: ${e.headline} (score ${e.score ?? "?"}${e.scoreDelta ? `, ${e.scoreDelta > 0 ? "+" : ""}${e.scoreDelta}` : ""})`)
    .join("\n");
  const findings = ctx.findings
    .map((f) => `- [${f.severity}] ${f.title}: ${f.plain_explanation}`)
    .join("\n");

  return `App being watched: ${ctx.appUrl}
Current score: ${ctx.latestScore ?? "not scanned yet"} / 100
Current verdict: ${ctx.latestVerdict === "certified" ? "safe to publish" : ctx.latestVerdict === "at_risk" ? "at risk — has open issues" : "unknown"}

Check history (newest first):
${history || "- no checks yet — the baseline scan hasn't run"}

Open findings on the latest scan:
${findings || "- none — the app is clean"}`;
}

/** Grounded fallback when no API key is configured — still answers from data. */
function fallbackReply(ctx: AppContext): string {
  if (ctx.latestVerdict === "certified") {
    return `Your app is currently safe — the last check scored it ${ctx.latestScore}/100 with no open issues. I'm watching it and will flag anything that breaks the moment you ship a change.`;
  }
  if (ctx.latestVerdict === "at_risk") {
    return `Your app has ${ctx.findings.length} open issue${ctx.findings.length === 1 ? "" : "s"} right now (score ${ctx.latestScore}/100). Open the latest report for the exact fix prompts to paste into your builder — once you ship the fix, I'll re-check automatically.`;
  }
  return `I'm watching ${ctx.appUrl}. The first baseline check hasn't completed yet — I'll have answers about this app as soon as it runs.`;
}

/**
 * Answer one chat turn about a watched app. Bounded and non-throwing: on any
 * API problem it falls back to a data-grounded canned reply, so the chat
 * never dies in the user's face.
 */
export async function agentChatReply(
  ctx: AppContext,
  turns: ChatTurn[],
  tools: AgentToolContext,
): Promise<string> {
  const key = anthropicKey();
  if (!key || turns.length === 0) return fallbackReply(ctx);

  // A hard ceiling on the loop. Each pass is another paid request, and this
  // runs inside a request with its own deadline, so the agent gets a small
  // budget: enough to look something up, act on it, and answer.
  const MAX_TURNS = 4;

  try {
    const client = new Anthropic({ apiKey: key, timeout: 25_000 });
    const messages: Anthropic.MessageParam[] = turns
      .slice(-12)
      .map((t) => ({ role: t.role, content: t.content }));

    for (let i = 0; i < MAX_TURNS; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1000,
        system: [
          { type: "text", text: SYSTEM },
          { type: "text", text: contextBlock(ctx) },
        ],
        tools: AGENT_TOOLS,
        messages,
      });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      // No tool call left to make — this is the answer.
      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim();
        return text || fallbackReply(ctx);
      }

      // Preserve the full assistant turn — dropping the tool_use blocks here
      // would orphan the results we're about to send back.
      messages.push({ role: "assistant", content: response.content });

      // Tools run against the server-bound app, never one the model named.
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const call of toolUses) {
        const out = await runAgentTool(
          tools,
          call.name,
          (call.input ?? {}) as Record<string, unknown>,
        );
        results.push({ type: "tool_result", tool_use_id: call.id, content: out });
      }
      messages.push({ role: "user", content: results });
    }

    log.warn("agent chat hit its turn ceiling", { turns: MAX_TURNS });
    return fallbackReply(ctx);
  } catch (err) {
    log.error("agent chat failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return fallbackReply(ctx);
  }
}
