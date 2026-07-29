/**
 * The tool schemas Assay advertises to other agents — pure data, free of
 * server-only imports so the contract other people's clients depend on can be
 * unit-tested without a database. Mirrors the pure/impure split used by the
 * scan engine and the in-app agent.
 */
export const MCP_TOOLS = [
  {
    name: "check_app_security",
    description:
      "Scan a live web app for the security holes AI-built apps ship with — secrets exposed in the browser bundle, a database readable without a login, public file storage, exposed config files, missing security headers — and return a verdict, a 0-100 safety score, and for each issue a plain-English explanation plus the exact instruction to fix it. Use this before deploying or publishing an app, or whenever the user asks whether their app is safe. Takes about a minute. Only scan apps the user owns.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "The full public URL of the running app to check, e.g. https://myapp.lovable.app",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "get_last_result",
    description:
      "Look up the most recent Assay check for an app the user has scanned before, without running a new one. Instant and free. Use this when the user asks about an app's known state, or to avoid re-scanning something checked moments ago.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The app URL to look up." },
      },
      required: ["url"],
    },
  },
];
