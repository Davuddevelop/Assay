import "server-only";

import { runScan } from "@/lib/scan/run";
import { explainFindings } from "@/lib/anthropic/explain";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeScanUsage } from "@/lib/usage";
import { getUserPlan } from "@/lib/data/subscriptions";
import { ScanError } from "@/lib/scan/types";
import { log } from "@/lib/log";
import { MCP_TOOLS } from "@/lib/mcp/tool-defs";

/**
 * What Assay exposes to other agents.
 *
 * The fix loop today runs through a person: Assay writes a precise, structured
 * instruction and a human copies it into their builder. That makes the human
 * an API call between two models. These tools let the builder's own agent ask
 * directly — "is this safe to deploy?" — answered before the app ships rather
 * than on a website afterwards.
 *
 * Every tool is scoped to the key's owner. A key authenticates one account and
 * can never read another's history.
 */
export { MCP_TOOLS };

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Render a scan into something an agent can act on directly. */
function formatReport(
  appUrl: string,
  score: number,
  verdict: string,
  findings: { severity: string; title: string; explanation: string; fix: string }[],
): string {
  const head = [
    `App: ${appUrl}`,
    `Verdict: ${verdict === "certified" ? "SAFE TO PUBLISH" : "NOT SAFE TO PUBLISH"}`,
    `Safety score: ${score}/100`,
    `Issues found: ${findings.length}`,
  ].join("\n");

  if (findings.length === 0) {
    return `${head}\n\nNo issues found in the checks Assay runs. Note this is a bounded automated check, not a full audit.`;
  }

  const body = findings
    .map(
      (f, i) =>
        `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n` +
        `   What it means: ${f.explanation}\n` +
        `   How to fix it: ${f.fix}`,
    )
    .join("\n\n");

  return `${head}\n\n${body}\n\nApply the fixes above, then run check_app_security again to confirm.`;
}

/**
 * Execute one MCP tool for an authenticated user. Never throws — a failure is
 * returned as text so the calling agent can relay it rather than crash.
 */
export async function runMcpTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<{ text: string; isError: boolean }> {
  try {
    switch (name) {
      case "check_app_security": {
        const raw = typeof args.url === "string" ? args.url : "";
        if (!raw.trim()) return { text: "A url is required.", isError: true };
        const url = normalizeUrl(raw);

        // Metered exactly like a scan started from the UI. An agent must not be
        // a way around a plan limit.
        const plan = await getUserPlan(userId);
        if (!(await consumeScanUsage(userId, plan))) {
          return {
            text: "This account has used every scan on its plan this month. Tell the user they can upgrade at https://assaysecurity.com/pricing to raise the limit.",
            isError: true,
          };
        }

        const result = await runScan(url);
        const explained = await explainFindings(result.findings, result.platform);
        const findings = result.findings.map((f, i) => ({
          severity: f.severity,
          title: explained[i]?.title ?? f.title,
          explanation: explained[i]?.plain_explanation ?? f.detail,
          fix: explained[i]?.fix_prompt ?? `Fix this security issue: ${f.title}. ${f.detail}`,
        }));

        // Recorded against the account so it shows up in their history and can
        // be watched, exactly as a scan run from the web app would be.
        const db = createAdminClient();
        const now = new Date().toISOString();
        const { data: scan } = await db
          .from("scans")
          .insert({
            user_id: userId,
            app_url: url,
            platform: result.platform,
            status: "completed",
            score: result.score,
            verdict: result.verdict,
            is_demo: false,
            completed_at: now,
          })
          .select("id")
          .single();
        if (scan) {
          await db.from("scan_findings").insert(
            result.findings.map((f, i) => ({
              scan_id: scan.id,
              kind: f.kind,
              severity: f.severity,
              title: findings[i].title,
              plain_explanation: findings[i].explanation,
              fix_prompt: findings[i].fix,
              manual_steps: (explained[i]?.manual_steps ?? []).join("\n"),
              redacted_location: f.redactedLocation,
            })),
          );
        }

        log.info("mcp scan", { verdict: result.verdict, findings: findings.length });
        return {
          text: formatReport(url, result.score, result.verdict, findings),
          isError: false,
        };
      }

      case "get_last_result": {
        const raw = typeof args.url === "string" ? args.url : "";
        if (!raw.trim()) return { text: "A url is required.", isError: true };
        const url = normalizeUrl(raw);

        const db = createAdminClient();
        const { data: scan } = await db
          .from("scans")
          .select("id, score, verdict, completed_at")
          .eq("user_id", userId)
          .eq("app_url", url)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!scan) {
          return {
            text: `No previous Assay check for ${url}. Run check_app_security to scan it.`,
            isError: false,
          };
        }

        const { data: rows } = await db
          .from("scan_findings")
          .select("severity, title, plain_explanation, fix_prompt")
          .eq("scan_id", scan.id)
          .order("severity");

        return {
          text: formatReport(
            url,
            scan.score ?? 0,
            scan.verdict ?? "at_risk",
            (rows ?? []).map((f) => ({
              severity: f.severity,
              title: f.title,
              explanation: f.plain_explanation,
              fix: f.fix_prompt,
            })),
          ) + `\n\n(Last checked ${scan.completed_at ?? "unknown"} — re-scan to confirm it is still current.)`,
          isError: false,
        };
      }

      default:
        return { text: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    // The fetcher's own messages are already written for a person; anything
    // else is internal and must not leak out.
    const text =
      err instanceof ScanError
        ? err.message
        : "That check couldn't be completed. Check the URL is a live, public app and try again.";
    log.warn("mcp tool failed", {
      tool: name,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return { text, isError: true };
  }
}
