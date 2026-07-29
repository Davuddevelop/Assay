import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { anthropicKey } from "@/lib/env";
import { log } from "@/lib/log";
import type { StoredTurn } from "@/lib/data/agent-memory";

/**
 * The agent speaking first.
 *
 * A regression used to send a template: same words every time, addressed to
 * nobody in particular. But by the time something breaks, the agent already
 * knows things a template cannot — that this is the third time this table has
 * been reopened, that the owner said last week they were launching Friday,
 * that they told it they'd already fixed this.
 *
 * So it writes the message itself. That is the difference between a tool
 * notifying you and someone who works for you tapping you on the shoulder.
 * Returns null on any failure, and the caller falls back to the template — a
 * worse alert is fine, a missing alert is not.
 */
const MODEL = "claude-sonnet-4-6";

const AlertSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export interface AlertInput {
  appUrl: string;
  score: number | null;
  prevScore: number | null;
  topFindings: { title: string; severity: string }[];
  /** What the agent and owner have said to each other about this app. */
  conversation: StoredTurn[];
}

const SYSTEM = `You are Assay — a security agent that watches ONE app for the person you're writing to. They built it with an AI tool and cannot read code. You are writing to them unprompted, because a change they just shipped reopened a security hole.

Write the message yourself. Rules:
- Plain language. Say what it means for THEM ("anyone on the internet can read your users' emails again"), never jargon.
- 3-5 sentences. First person. Calm and direct — this is urgent, not panicked. No exclamation marks, no greeting, no sign-off.
- Lead with what broke. Then what it means. Then that the fix is on their report.
- Use your history with them if it is genuinely relevant: if they told you they had fixed this, or that they were launching soon, or if this same issue has come back before, say so plainly and kindly. If none of that applies, don't force it.
- Never invent history, findings, numbers, or dates. Only use what you are given.
- The subject line is one short sentence naming what broke — no "Alert:" or "Warning:" prefix.`;

function contextBlock(input: AlertInput): string {
  const findings = input.topFindings.length
    ? input.topFindings.map((f) => `- [${f.severity}] ${f.title}`).join("\n")
    : "- (none recorded)";
  const history = input.conversation.length
    ? input.conversation
        .slice(-16)
        .map((t) => `${t.role === "user" ? "Owner" : "You"}: ${t.content}`)
        .join("\n")
    : "(you have not spoken before)";

  return `App: ${input.appUrl}
Safety score: was ${input.prevScore ?? "unknown"}, now ${input.score ?? "unknown"}
What is open now:
${findings}

Your previous conversation with the owner:
${history}`;
}

/** Compose a regression alert. Null when unavailable — caller uses the template. */
export async function composeRegressionAlert(
  input: AlertInput,
): Promise<{ subject: string; body: string } | null> {
  const key = anthropicKey();
  if (!key) return null;

  try {
    const client = new Anthropic({ apiKey: key, timeout: 20_000, maxRetries: 0 });
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 600,
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: contextBlock(input) },
      ],
      messages: [
        {
          role: "user",
          content:
            "Write the message telling them what just broke on their app, and the subject line for it.",
        },
      ],
      output_config: { format: zodOutputFormat(AlertSchema) },
    });

    const out = response.parsed_output;
    if (!out?.subject.trim() || !out.body.trim()) return null;
    return { subject: out.subject.trim(), body: out.body.trim() };
  } catch (err) {
    // Never silent: the owner still gets the templated alert, but a persistent
    // failure here means the product has quietly lost its voice.
    log.warn("agent alert compose failed, using template", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}
