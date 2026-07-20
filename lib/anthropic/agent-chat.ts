import Anthropic from "@anthropic-ai/sdk";

import { anthropicKey } from "@/lib/env";
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
- Ground every answer in the scan data you're given. Never invent findings, scores, or history. If you don't know, say so and suggest running a fresh scan.
- Be a calm, competent coworker: short answers (2-5 sentences), first person, warm but direct. No exclamation marks, no filler.
- When they ask how to fix something, point them at the fix prompt on their report, or give the exact message to paste into their builder.
- Only discuss THIS app and its security. For anything else, gently steer back.`;

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
export async function agentChatReply(ctx: AppContext, turns: ChatTurn[]): Promise<string> {
  const key = anthropicKey();
  if (!key || turns.length === 0) return fallbackReply(ctx);

  try {
    const client = new Anthropic({ apiKey: key, timeout: 25_000 });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: contextBlock(ctx) },
      ],
      messages: turns.slice(-12).map((t) => ({ role: t.role, content: t.content })),
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || fallbackReply(ctx);
  } catch {
    return fallbackReply(ctx);
  }
}
