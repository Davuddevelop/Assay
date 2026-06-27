import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { getEnv } from "@/lib/env";
import { renderDiff, type PullDiff } from "@/lib/github/diff";

/**
 * AI review. Every call returns a structured list of findings — never free
 * text we have to parse loosely. We use Sonnet 4.6 with a JSON-schema output
 * format derived from the Zod schema below, so the SDK validates the shape for
 * us and we get typed `findings` back.
 */

// User's explicit model choice (exact id, no date suffix).
const MODEL = "claude-sonnet-4-6";

export const FindingSchema = z.object({
  type: z.enum(["rule", "security", "test", "quality"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string(),
  file: z.string().nullable(),
  line: z.number().int().nullable(),
  suggestion: z.string().nullable(),
});

export const ReviewSchema = z.object({
  findings: z.array(FindingSchema),
});

export type ReviewFinding = z.infer<typeof FindingSchema>;
export type ReviewResult = z.infer<typeof ReviewSchema>;

/**
 * Validate/normalize a raw model payload into findings. Pure and exported so
 * the parsing contract can be unit-tested without calling the API.
 */
export function parseFindings(raw: unknown): ReviewFinding[] {
  return ReviewSchema.parse(raw).findings;
}

const SYSTEM = `You are Assay, an independent checkpoint for code written with AI assistance.
You review a pull request diff and report concrete problems as structured findings.

You are strict but precise. Only report a finding when you can point to a real
problem in the changed code. Do not invent issues to seem thorough; an empty
findings list is the correct answer for a clean change.

Finding types:
- "rule": the change violates one of the user's plain-language rules below.
- "security": a security problem (secret/credential exposure, injection, unsafe
  data handling, logging sensitive data, auth bypass).
- "test": the change appears to break existing behavior or a test.
- "quality": a correctness/maintainability concern that isn't one of the above.

Severity: "critical" and "high" block the change; "low"/"medium" are advisory
unless the type is rule/security/test. Set "file" and "line" to the location in
the diff when you can; use null when not applicable. Put a short, actionable fix
in "suggestion" (or null).`;

function buildUserPrompt(rules: string, diff: PullDiff, context: string): string {
  const rulesBlock = rules.trim()
    ? rules.trim()
    : "(The user has not written any custom rules. Apply general correctness and security judgment.)";
  const parts = ["## The user's rules", rulesBlock, ""];

  if (context.trim()) {
    parts.push(
      "## Relevant repository context",
      "Existing code retrieved for context (do not review it; use it to judge the change):",
      context,
      "",
    );
  }

  parts.push(
    "## The pull request diff",
    renderDiff(diff),
    "",
    "Report every concrete problem you find as a finding. If the change is sound, return an empty findings list.",
  );
  return parts.join("\n");
}

export interface ReviewInput {
  rules: string;
  diff: PullDiff;
  /** Optional repo context retrieved via embeddings; improves judgment. */
  context?: string;
}

/** Run the AI review and return validated findings. */
export async function reviewDiff({ rules, diff, context = "" }: ReviewInput): Promise<ReviewFinding[]> {
  const client = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: "user", content: buildUserPrompt(rules, diff, context) }],
    output_config: {
      format: zodOutputFormat(ReviewSchema),
    },
  });

  // parsed_output is null only if the model failed to produce valid output.
  return response.parsed_output?.findings ?? [];
}
