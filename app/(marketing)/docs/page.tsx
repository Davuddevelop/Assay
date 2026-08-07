import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";
import { MCP_TOOLS } from "@/lib/mcp/tool-defs";

export const metadata: Metadata = {
  alternates: { canonical: "/docs" },
  title: "Docs — run Assay from your editor, or from a URL",
  description:
    "How Assay checks apps built with Lovable, Bolt, Replit and v0 — from the web, or as an MCP server your coding agent can call before it ships. Setup, tools, and the re-check loop.",
};

/**
 * The docs page.
 *
 * What was here was sixty-five lines repeating the home page's three steps.
 * That is a brochure, not documentation, and it left the two things this
 * product has that competitors advertise as their headline differentiators —
 * an MCP server and a per-finding re-check — documented nowhere at all. The
 * MCP endpoint has existed and worked for some time; its only mention on the
 * entire site was one sentence on a settings page behind a login, which means
 * nobody who hasn't already signed up could discover it, and nobody who had
 * could set it up.
 *
 * Everything below is checked against the code rather than written from
 * memory: the tool list is imported from lib/mcp/tool-defs.ts so it cannot
 * drift, the key prefix matches lib/api-keys-core.ts, and the endpoint,
 * transport and auth match app/api/mcp/route.ts.
 */

const KEY_PREFIX = "assay_sk_";
const MCP_ENDPOINT = "https://assaysecurity.com/api/mcp";

const CHECKS = [
  {
    name: "Secrets in the browser bundle",
    body: "The JavaScript your app ships is public. Assay reads it the way anyone can and looks for credentials that shouldn't be there — Stripe secret keys, Supabase service-role keys, API tokens. It records the type and a redacted location, never the value.",
  },
  {
    name: "A database anyone can read",
    body: "The most common failure in AI-built apps: Supabase row-level security left off, or Firebase rules still in test mode, so every row is readable without a login. Assay probes this read-only and tells you which tables are open.",
  },
  {
    name: "Open file storage",
    body: "Public buckets that were meant to be private — uploads, avatars, documents — reachable by anyone with the URL.",
  },
  {
    name: "Exposed config files",
    body: "A committed .env, an exposed .git directory, a backup left in the web root. Bounded GETs for the handful of paths that leak most often.",
  },
  {
    name: "Missing security headers",
    body: "The response headers a published app is meant to send and a generated one usually doesn't.",
  },
];

export default function DocsPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Docs" />
      <h1 className="mt-6 text-balance font-display text-4xl font-bold tracking-[-0.025em] text-ivory">
        Run it from a URL, or from inside your editor
      </h1>
      <p className="mt-5 text-base leading-relaxed text-ivory-dim">
        Assay checks a live app from the outside — no login to your app, no
        access to your code. You can point it at a URL yourself, or let the
        coding agent you&rsquo;re already working with call it before the app
        ships.
      </p>

      {/* ── The web path ─────────────────────────────────────────────── */}
      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        From the web
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Paste your live app&rsquo;s URL at{" "}
        <Link href="/try" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
          /try
        </Link>
        . No account needed for a first verdict. The scan runs in front of you
        and takes about a minute. Every issue comes back in plain language with
        the exact instruction to paste back into your builder.
      </p>

      {/* ── MCP ──────────────────────────────────────────────────────── */}
      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        From your editor (MCP)
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Assay is a{" "}
        <a
          href="https://modelcontextprotocol.io"
          className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
          target="_blank"
          rel="noreferrer"
        >
          Model Context Protocol
        </a>{" "}
        server. Point Claude Code, Cursor, or any MCP client at it and your
        agent can ask &ldquo;is this safe to publish?&rdquo; directly &mdash;
        before the app ships, instead of on a website afterwards.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ivory">
        This is the independence argument at its sharpest: the model that wrote
        the code doesn&rsquo;t get to decide the code is safe. It has to ask
        something that isn&rsquo;t it.
      </p>

      <h3 className="mt-10 text-lg font-medium text-ivory">1. Create a key</h3>
      <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
        Sign in and go to{" "}
        <Link href="/settings/keys" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
          Settings → API keys
        </Link>
        . Keys start with{" "}
        <code className="rounded-[var(--radius-control)] border border-line bg-onyx px-1.5 py-0.5 font-mono text-xs text-ivory">
          {KEY_PREFIX}
        </code>{" "}
        and are shown once. A key authenticates one account and can never read
        another&rsquo;s history.
      </p>

      <h3 className="mt-8 text-lg font-medium text-ivory">2. Add the server</h3>
      <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
        Streamable HTTP transport, bearer auth. In Claude Code:
      </p>
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-onyx">
        <pre className="px-4 py-3 font-mono text-xs leading-relaxed text-ivory-dim">
          <code>{`claude mcp add --transport http assay ${MCP_ENDPOINT} \\
  --header "Authorization: Bearer ${KEY_PREFIX}your_key_here"`}</code>
        </pre>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ivory-dim">
        Or, for any client that takes a JSON config:
      </p>
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-onyx">
        <pre className="px-4 py-3 font-mono text-xs leading-relaxed text-ivory-dim">
          <code>{`{
  "mcpServers": {
    "assay": {
      "type": "http",
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer ${KEY_PREFIX}your_key_here"
      }
    }
  }
}`}</code>
        </pre>
      </div>

      <h3 className="mt-8 text-lg font-medium text-ivory">3. The tools</h3>
      {/* Imported from the same module the server advertises, so this list
          cannot describe a tool that doesn't exist or miss one that does. */}
      <dl className="mt-5 space-y-6">
        {MCP_TOOLS.map((t) => (
          <div key={t.name}>
            <dt className="font-mono text-sm text-ivory">{t.name}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ivory-dim">
              {t.description}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-ivory-dim">
        A scan counts against your plan&rsquo;s allowance exactly as a web scan
        does.{" "}
        <code className="rounded-[var(--radius-control)] border border-line bg-onyx px-1.5 py-0.5 font-mono text-xs text-ivory">
          get_last_result
        </code>{" "}
        is free and instant, so an agent can check a known state without
        spending one.
      </p>

      {/* ── The re-check loop ────────────────────────────────────────── */}
      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        Proving a fix actually worked
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Every finding in a report has a re-check button. It runs just that one
        check against the live app again and tells you whether the issue is
        actually gone &mdash; usually a single request, so it&rsquo;s fast
        enough to use as a loop while you&rsquo;re fixing things.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ivory">
        This matters for the same reason the rest of the product does. You
        can&rsquo;t confirm your own fix any more than you can clear your own
        app &mdash; &ldquo;I applied the change&rdquo; is not the same as
        &ldquo;the hole is closed.&rdquo; The re-check is what turns one into
        the other.
      </p>

      {/* ── What it checks ───────────────────────────────────────────── */}
      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        What it checks
      </h2>
      <dl className="mt-6 space-y-5">
        {CHECKS.map((c) => (
          <div key={c.name} className="border-t border-line pt-5">
            <dt className="text-base font-medium text-ivory">{c.name}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ivory-dim">
              {c.body}
            </dd>
          </div>
        ))}
      </dl>

      {/* ── Limits ───────────────────────────────────────────────────── */}
      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        What it doesn&rsquo;t do
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        Assay reads. It never writes. No exploit is sent, nothing is changed,
        and your users&rsquo; data is never copied or stored &mdash; when a
        check proves a database is readable, the values are masked in memory
        and never saved.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        It checks what any visitor can already reach, so it does not log in and
        does not see anything behind your sign-in screen. It is a bounded
        automated check for known misconfigurations &mdash; not a penetration
        test, and not a guarantee.{" "}
        <Link href="/about" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
          The full list of what it misses is written down
        </Link>
        .
      </p>

      <p className="mt-10 text-xs leading-relaxed text-ash">
        Scan only apps you own or are authorized to test &mdash; see our{" "}
        <Link href="/acceptable-use" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
          Acceptable Use Policy
        </Link>
        .
      </p>

      <p className="mt-8 text-sm text-ash">
        Ready?{" "}
        <Link href="/try" className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory">
          Scan your app →
        </Link>
      </p>
    </div>
  );
}
