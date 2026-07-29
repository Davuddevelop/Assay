/**
 * The agent's tool schemas — pure data, sent verbatim to the model on every
 * turn. Kept free of server-only imports (and of any I/O) so the shape of the
 * agent's capabilities can be unit-tested without a database, mirroring the
 * pure/impure split the scan engine already uses.
 *
 * SECURITY: no tool takes an app url, user id, or scan id. The app under
 * discussion is bound server-side by the executor from an RLS-scoped read, so
 * there is deliberately no parameter through which a crafted message could
 * point a tool at somebody else's app. `tests/agent-tools.test.ts` enforces it.
 */
/** Tool schemas sent to the model. Kept beside the executor so they can't drift. */
export const AGENT_TOOLS = [
  {
    name: "get_current_status",
    description:
      "Read this app's CURRENT security status directly from the database — score, verdict, when it was last checked, and the list of open findings. Call this whenever the person asks whether their app is safe right now, or before making any claim about its present state. The conversation context may be stale; this is never stale.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_finding_details",
    description:
      "Get the full details of one open finding: the plain-English explanation, the exact paste-back fix prompt for their builder, and the manual click-by-click steps. Call this when the person asks how to fix something, or what a specific issue means.",
    input_schema: {
      type: "object" as const,
      properties: {
        finding_title: {
          type: "string",
          description:
            "The title of the finding, as shown in the current status (e.g. 'Anyone can read your users' private data').",
        },
      },
      required: ["finding_title"],
    },
  },
  {
    name: "recheck_finding",
    description:
      "Re-run ONE security check against the live app right now to see whether a specific issue is fixed. Use this the moment the person says they've applied a fix — it takes a few seconds and gives a definitive yes or no. Do not guess whether a fix worked; check.",
    input_schema: {
      type: "object" as const,
      properties: {
        finding_title: {
          type: "string",
          description: "The title of the finding to re-verify.",
        },
      },
      required: ["finding_title"],
    },
  },
  {
    name: "compare_with_previous",
    description:
      "Compare the two most recent completed checks of this app — what the score was, what it is now, and whether a change made it better or worse. Call this when the person asks what changed, or whether something they shipped broke anything.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "start_full_rescan",
    description:
      "Start a complete fresh scan of the app. This runs in the background and takes about a minute, so it does NOT return results — it returns confirmation that it started. Only call this when the person explicitly asks for a full re-scan, or when a single re-check is not enough to answer. For verifying one fix, prefer recheck_finding, which is far faster and cheaper.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "list_my_apps",
    description:
      "List EVERY app this person is watching with Assay, worst-first: each one's safety score, verdict, how many critical and risky issues are open, when it was last checked, and whether a recent change broke something. Call this whenever they ask about more than the app in front of them — 'which of my apps should I worry about first?', 'are any of my client sites at risk?', 'what needs attention this week?'. Takes no parameters and only ever returns apps they own.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "set_monitoring",
    description:
      "Turn continuous monitoring on or off for this app. When on, Assay re-checks it whenever the owner ships a change and flags anything that breaks. Only call this when the person clearly asks to start or stop watching.",
    input_schema: {
      type: "object" as const,
      properties: {
        active: {
          type: "boolean",
          description: "true to start watching this app, false to stop.",
        },
      },
      required: ["active"],
    },
  },
];
