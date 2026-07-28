import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { anthropicKey } from "@/lib/env";
import { log } from "@/lib/log";
import type { RawFinding } from "@/lib/scan/types";

/**
 * The moat: turn technical findings into something a non-coder can act on.
 * For each issue, Claude writes a plain-language explanation (fear-then-relief)
 * and the EXACT prompt to paste back into Lovable/Bolt to fix it, plus manual
 * fallback steps. Structured JSON via the same pattern as the old review.
 */
const MODEL = "claude-sonnet-4-6";

const ExplainedSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      plain_explanation: z.string(),
      fix_prompt: z.string(),
      manual_steps: z.array(z.string()),
    }),
  ),
});

export interface ExplainedFinding {
  title: string;
  plain_explanation: string;
  fix_prompt: string;
  manual_steps: string[];
}

const SYSTEM = `You are Assay, a security checkpoint for non-technical people who build apps with tools like Lovable, Bolt, Replit, and v0.

You translate security findings for someone who CANNOT read code. Rules:
- Plain language. No jargon, no CVSS, no "BOLA"/"CORS". Say what it means for them: "Right now, anyone on the internet can read your users' email addresses."
- Fear-then-relief: name the real risk plainly, then reassure that it's fixable.
- For "fix_prompt", write the EXACT message they can copy and paste back into their builder (Lovable/Bolt/etc.) to fix it. Make it specific and self-contained.
- For "manual_steps", give 2–4 short click-by-click fallback steps (e.g. in the Supabase dashboard).
- Keep the original meaning; never invent issues. Return one entry per input finding, in order.`;

function fallback(raw: RawFinding[]): ExplainedFinding[] {
  return raw.map((f) => ({
    title: f.title,
    plain_explanation: f.detail,
    fix_prompt: `Ask your builder to fix this security issue: ${f.title}. ${f.detail}`,
    manual_steps: [],
  }));
}

/**
 * Explain findings for a non-coder. Falls back to the raw technical text when
 * the Anthropic key isn't configured, so a scan still returns a usable report.
 */
export async function explainFindings(
  raw: RawFinding[],
  platform: string,
): Promise<ExplainedFinding[]> {
  if (raw.length === 0) return [];
  const key = anthropicKey();
  if (!key) return fallback(raw);

  try {
    // Bounded so a slow/degraded API response can't blow the scan's own overall
    // time budget — falls back to the raw finding text on timeout.
    //
    // 15s was too tight: a typical 4–6 finding report generates well over a
    // thousand output tokens and routinely timed out, silently replacing every
    // paste-back fix prompt (the thing the product is actually for) with a
    // generic sentence. Retries are off because the SDK defaults to 2, which
    // turned one slow call into three sequential timeouts and blew the
    // function's own 60s ceiling.
    const client = new Anthropic({ apiKey: key, timeout: 30_000, maxRetries: 0 });
    const input = raw.map((f, i) => ({
      index: i,
      title: f.title,
      detail: f.detail,
      severity: f.severity,
    }));

    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `The app was built with: ${platform}. Explain these findings:\n${JSON.stringify(input, null, 2)}`,
        },
      ],
      output_config: { format: zodOutputFormat(ExplainedSchema) },
    });

    const out = response.parsed_output?.findings;
    if (!out || out.length !== raw.length) {
      log.warn("explain: unusable response, falling back to raw findings", {
        expected: raw.length,
        got: out?.length ?? 0,
      });
      return fallback(raw);
    }
    return out;
  } catch (err) {
    // Never silent: this degradation replaces the paste-back fix prompts with
    // generic text, and without a log there is no way to tell a rate limit from
    // a timeout from a schema mismatch after the fact.
    log.error("explain failed, falling back to raw findings", {
      findings: raw.length,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return fallback(raw);
  }
}
