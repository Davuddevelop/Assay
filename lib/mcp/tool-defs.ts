/**
 * The tool schemas Assay advertises to other agents — pure data, free of
 * server-only imports so the contract other people's clients depend on can be
 * unit-tested without a database. Mirrors the pure/impure split used by the
 * scan engine and the in-app agent.
 *
 * These descriptions are not documentation. They are the prompt a model reads
 * when deciding which of its tools to reach for, so they are written for that
 * job: the trigger conditions come first ("before deploying", "when the user
 * asks whether their app is safe"), and the vocabulary is the vocabulary
 * someone actually uses — vibe coding, Lovable, Bolt, Supabase RLS — rather
 * than the brand language the marketing pages use. A model matching a user's
 * "is my Lovable app safe?" against a tool that only says "independent
 * security check" has to do a translation step it may not make.
 *
 * Written to read naturally at the same time. A keyword-stuffed description
 * degrades tool selection, because the model is reading it as a sentence.
 */
export const MCP_TOOLS = [
  {
    name: "check_app_security",
    description:
      "Security scanner for vibe-coded and AI-built web apps. Scans a live app built with Lovable, Bolt, Replit, v0, Cursor, or any AI coding tool and finds the security holes these apps ship with: secrets and API keys exposed in the browser bundle (Stripe keys, Supabase service-role keys), a database readable without a login (Supabase row-level security disabled, Firebase rules left open), public file storage, exposed .env and .git files, and missing security headers. Returns a verdict, a 0-100 safety score, and for each issue a plain-English explanation plus the exact instruction to fix it. Use this before deploying or publishing an app, when the user asks whether their app is safe or secure, or when they ask about Supabase RLS, exposed keys, or leaked credentials. Read-only: it never writes, never exploits, and never stores the app's data. Takes about a minute. Only scan apps the user owns.",
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
      "Look up the most recent Assay security check for an app the user has scanned before, without running a new one. Instant and free — it spends no scan allowance. Use this when the user asks about an app's known security state, when they want to compare against a previous result, or to avoid re-scanning something checked moments ago.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The app URL to look up." },
      },
      required: ["url"],
    },
  },
];
