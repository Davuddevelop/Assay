import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createScan } from "@/lib/data/scans";
import { setWatch } from "@/lib/data/monitors";
import { recheckFinding } from "@/lib/scan/recheck";
import { compareScans } from "@/lib/scan/diff";
import { consumeScanUsage } from "@/lib/usage";
import { getUserPlan } from "@/lib/data/subscriptions";
import { inngest, EVENTS } from "@/inngest/client";
import { log } from "@/lib/log";
import { AGENT_TOOLS } from "@/lib/anthropic/agent-tool-defs";

// Re-exported so callers get the schemas and the executor from one place.
export { AGENT_TOOLS };

/**
 * The context the agent's hands act through.
 *
 * Until now the agent could only describe a snapshot taken when the page
 * loaded — ask it "is my app safe right now?" and it answered from possibly
 * stale context with no way to check. The tools below let it look, verify,
 * and act.
 *
 * SECURITY — the one invariant this file exists to hold: the app under
 * discussion is bound into this context by the route *after* it has resolved
 * the monitor through RLS. It is never a tool parameter. No amount of prompt
 * injection can make the agent read, re-scan, or unwatch somebody else's app,
 * because there is no argument through which another app could be named.
 */
export interface AgentToolContext {
  userId: string;
  /** Resolved server-side from an RLS-scoped read. Never model-supplied. */
  appUrl: string;
}

interface FindingRow {
  kind: string;
  severity: string;
  title: string;
  plain_explanation: string;
  fix_prompt: string;
  manual_steps: string;
}

/** The latest completed scan for the bound app, with its findings. */
async function latestScan(ctx: AgentToolContext) {
  const db = createAdminClient();
  const { data: scan } = await db
    .from("scans")
    .select("id, score, verdict, completed_at")
    .eq("app_url", ctx.appUrl)
    .eq("user_id", ctx.userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!scan) return { scan: null, findings: [] as FindingRow[] };

  const { data: findings } = await db
    .from("scan_findings")
    .select("kind, severity, title, plain_explanation, fix_prompt, manual_steps")
    .eq("scan_id", scan.id)
    .order("severity");
  return { scan, findings: (findings ?? []) as FindingRow[] };
}

/** Loosely match a model-supplied title against a real finding. */
function matchFinding(findings: FindingRow[], title: string): FindingRow | null {
  const want = title.trim().toLowerCase();
  return (
    findings.find((f) => f.title.toLowerCase() === want) ??
    findings.find((f) => f.title.toLowerCase().includes(want)) ??
    findings.find((f) => want.includes(f.title.toLowerCase())) ??
    null
  );
}

/**
 * Execute one tool call. Returns a plain-text result for the model.
 *
 * Never throws — a tool failure comes back as text the agent can relay ("I
 * couldn't check that just now"), because a broken tool must degrade into a
 * worse answer, never into a broken chat.
 */
export async function runAgentTool(
  ctx: AgentToolContext,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  try {
    switch (name) {
      case "get_current_status": {
        const { scan, findings } = await latestScan(ctx);
        if (!scan) return "No completed check yet for this app.";
        const list = findings.length
          ? findings.map((f) => `- [${f.severity}] ${f.title}`).join("\n")
          : "- none, the app is clean";
        return [
          `Score: ${scan.score ?? "unknown"}/100`,
          `Verdict: ${scan.verdict === "certified" ? "safe to publish" : "at risk — has open issues"}`,
          `Last checked: ${scan.completed_at ?? "unknown"}`,
          `Open findings:\n${list}`,
        ].join("\n");
      }

      case "get_finding_details": {
        const { findings } = await latestScan(ctx);
        const f = matchFinding(findings, String(input.finding_title ?? ""));
        if (!f) return "No open finding matches that. Call get_current_status for the current list.";
        return [
          `Title: ${f.title}`,
          `Severity: ${f.severity}`,
          `What it means: ${f.plain_explanation}`,
          `Exact prompt to paste into their builder:\n${f.fix_prompt}`,
          f.manual_steps ? `Manual steps:\n${f.manual_steps}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
      }

      case "recheck_finding": {
        const { findings } = await latestScan(ctx);
        const f = matchFinding(findings, String(input.finding_title ?? ""));
        if (!f) return "No open finding matches that, so there is nothing to re-check.";
        const { resolved } = await recheckFinding(ctx.appUrl, f.kind, f.title);
        log.info("agent recheck", { resolved, kind: f.kind });
        return resolved
          ? `FIXED — "${f.title}" no longer appears. Tell them plainly that it is resolved, and that a full re-scan will refresh their score and badge.`
          : `STILL PRESENT — "${f.title}" is unchanged on the live app. Their builder may not have deployed yet; suggest waiting a moment and re-checking.`;
      }

      case "compare_with_previous": {
        const db = createAdminClient();
        const { data: rows } = await db
          .from("scans")
          .select("score, verdict, completed_at")
          .eq("app_url", ctx.appUrl)
          .eq("user_id", ctx.userId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(2);
        const [current = null, previous = null] = rows ?? [];
        if (!current) return "No completed checks yet, so there is nothing to compare.";
        if (!previous) return "Only one check so far — no earlier result to compare against.";
        const d = compareScans(previous, current);
        return [
          `Previous: ${previous.score ?? "?"}/100 on ${previous.completed_at ?? "?"}`,
          `Current: ${current.score ?? "?"}/100 on ${current.completed_at ?? "?"}`,
          `Change: ${d.scoreDelta === null ? "unknown" : d.scoreDelta > 0 ? `+${d.scoreDelta}` : d.scoreDelta}`,
          d.regression
            ? "A change BROKE something — a recent edit reopened a security hole."
            : d.improved
              ? "It got better — an issue was fixed."
              : "No meaningful change between these two checks.",
        ].join("\n");
      }

      case "start_full_rescan": {
        // A full scan is the expensive path (outbound crawl + an LLM call), so
        // it consumes the same monthly meter as a scan started from the UI. An
        // agent must not be a way to bypass a plan limit.
        const plan = await getUserPlan(ctx.userId);
        if (!(await consumeScanUsage(ctx.userId, plan))) {
          return "LIMIT REACHED — they have used every scan on their plan this month. Tell them plainly and mention that upgrading raises the limit.";
        }
        // Runs in the background: a full scan takes longer than this request is
        // allowed to live, so we hand it to the job queue and return at once.
        const scanId = await createScan(ctx.userId, ctx.appUrl);
        await inngest.send({ name: EVENTS.scanRequested, data: { scanId } });
        log.info("agent started rescan", { scanId });
        return "STARTED — a full re-scan is now running in the background. It takes about a minute. Tell them it is running and that you'll have the result shortly; do not claim any result yet.";
      }

      case "set_monitoring": {
        const active = input.active === true;
        await setWatch(ctx.userId, ctx.appUrl, active);
        log.info("agent set watch", { active });
        return active
          ? "MONITORING ON — Assay will now re-check this app whenever they ship a change."
          : "MONITORING OFF — Assay has stopped watching this app.";
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    log.error("agent tool failed", {
      tool: name,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return "That check failed just now. Tell them you couldn't complete it and suggest trying again shortly.";
  }
}
