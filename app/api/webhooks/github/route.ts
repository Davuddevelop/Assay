import { verify } from "@octokit/webhooks-methods";

import { getEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { inngest } from "@/inngest/client";

// Webhook handling must be fast and untrusted-input safe: verify the GitHub
// signature, hand the work to Inngest, and return — never block on the actual
// check. Run on Node (crypto + raw body), and never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal shapes for the webhook payloads we act on. */
interface PullRequestPayload {
  action: string;
  pull_request: { number: number; head: { sha: string } };
  repository: { id: number; full_name: string; default_branch: string };
  installation: { id: number };
}

interface InstallationPayload {
  installation: { id: number };
}

const RUN_CHECK_ACTIONS = new Set(["opened", "synchronize", "reopened"]);

export async function POST(req: Request) {
  const env = getEnv();

  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");
  const delivery = req.headers.get("x-github-delivery");
  const body = await req.text();

  if (!signature || !event || !delivery) {
    return new Response("Missing GitHub headers", { status: 400 });
  }

  // Constant-time HMAC check. Reject anything we can't verify before parsing.
  const valid = await verify(env.GITHUB_WEBHOOK_SECRET, body, signature).catch(
    () => false,
  );
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    switch (event) {
      case "pull_request": {
        const p = payload as PullRequestPayload;
        if (RUN_CHECK_ACTIONS.has(p.action)) {
          await inngest.send({
            name: "github/pull_request",
            // Dedupe GitHub's at-least-once retries by delivery id.
            id: `pr:${delivery}`,
            data: {
              githubInstallId: p.installation.id,
              repoGithubId: p.repository.id,
              fullName: p.repository.full_name,
              defaultBranch: p.repository.default_branch,
              commitSha: p.pull_request.head.sha,
              prNumber: p.pull_request.number,
            },
          });
        }
        break;
      }
      case "installation":
      case "installation_repositories": {
        const p = payload as InstallationPayload;
        await inngest.send({
          name: "github/installation.sync",
          id: `install:${delivery}`,
          data: { githubInstallId: p.installation.id },
        });
        break;
      }
      default:
        // Acknowledge unhandled events so GitHub stops retrying.
        break;
    }
  } catch {
    // If enqueueing fails, 500 so GitHub retries (the delivery id keeps it
    // idempotent). Log the event name only — never the payload.
    log.error("webhook enqueue failed", { event, delivery });
    return new Response("Failed to enqueue", { status: 500 });
  }

  return new Response("ok", { status: 202 });
}
