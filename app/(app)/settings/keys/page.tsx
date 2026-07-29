import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { listApiKeys } from "@/lib/api-keys";
import { siteUrl } from "@/lib/env";
import { SubmitButton } from "@/components/ui/submit-button";
import { CreateKeyForm } from "@/app/(app)/settings/keys/create-key-form";
import { revokeKeyAction } from "@/app/(app)/settings/keys/actions";

export const metadata: Metadata = {
  title: "API keys — Assay",
  description: "Create and revoke the keys your coding agent uses to reach Assay.",
  robots: { index: false, follow: true },
};

export default async function KeysPage() {
  const user = await requireUser();
  const keys = await listApiKeys(user.id);
  const endpoint = `${siteUrl()}/api/mcp`;

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        assay: {
          type: "http",
          url: endpoint,
          headers: { Authorization: "Bearer YOUR_KEY" },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="font-mono text-xs uppercase tracking-[0.14em] text-ash transition-colors hover:text-ivory"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ivory sm:text-4xl">
        API keys
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ivory-dim">
        A key lets the agent you already build with — Claude Code, Cursor, or any
        MCP client — run an Assay check itself, before the app ships, instead of
        you carrying findings back by hand. Scans count against your plan exactly
        as they do here.
      </p>

      <CreateKeyForm />

      {/* live keys */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
        Your keys
      </h2>
      {keys.length === 0 ? (
        <p className="mt-3 text-sm text-ash">No keys yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ivory">{k.label}</p>
                <p className="mt-1 font-mono text-xs text-ash">
                  {k.prefix}… · created {new Date(k.createdAt).toLocaleDateString()} ·{" "}
                  {k.lastUsedAt
                    ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : "never used"}
                </p>
              </div>
              <form action={revokeKeyAction}>
                <input type="hidden" name="id" value={k.id} />
                <SubmitButton variant="danger" size="sm" pendingText="Revoking…">
                  Revoke
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* setup */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
        Connect your agent
      </h2>
      <p className="mt-3 text-sm text-ivory-dim">
        Add Assay as an MCP server. In Claude Code that is one command:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60 p-4 font-mono text-xs text-ivory">
        {`claude mcp add --transport http assay ${endpoint} \\\n  --header "Authorization: Bearer YOUR_KEY"`}
      </pre>
      <p className="mt-4 text-sm text-ivory-dim">
        For any other MCP client, point it at the same endpoint:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface/60 p-4 font-mono text-xs text-ivory">
        {mcpConfig}
      </pre>
      <p className="mt-4 text-sm text-ash">
        Then ask your agent to check the app before you deploy. It can run{" "}
        <span className="font-mono text-ivory-dim">check_app_security</span> to
        scan, or <span className="font-mono text-ivory-dim">get_last_result</span>{" "}
        to read back the previous verdict without spending a scan. A key reaches
        only its own account&rsquo;s apps.
      </p>
    </div>
  );
}
