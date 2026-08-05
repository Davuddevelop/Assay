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

  return (
    <div className="mx-auto w-full max-w-4xl xl:max-w-5xl px-4 py-12 sm:px-6">
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
      <p className="mt-3 max-w-2xl text-sm text-ash">
        You don&rsquo;t need a key to use Assay. Scanning from the dashboard works
        the same and takes no setup — this is for driving it from your editor.
      </p>

      {/* Creating a key is also the only moment we can hand over a config that
          already works, so the setup instructions live inside this panel. */}
      <CreateKeyForm endpoint={endpoint} />

      <h2 className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-ash">
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
      {keys.length > 0 && (
        <p className="mt-3 text-sm text-ash">
          Setup instructions appear when a key is created, because that is the only
          time the key itself can be shown. Lost yours? Revoke it and make a new one.
        </p>
      )}

      <h2 className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-ash">
        What your agent can do
      </h2>
      <ul className="mt-4 space-y-3 text-sm text-ivory-dim">
        <li>
          <span className="font-mono text-ivory">check_app_security</span> — scans a
          live app and returns a verdict, a score, and the fix for each issue. Takes
          about a minute and uses one scan from your plan.
        </li>
        <li>
          <span className="font-mono text-ivory">get_last_result</span> — reads back
          the previous verdict for an app. Instant, and costs nothing.
        </li>
      </ul>
      <p className="mt-4 text-sm text-ash">
        A key reaches only its own account&rsquo;s apps. The endpoint is{" "}
        <span className="font-mono text-ivory-dim">{endpoint}</span>.
      </p>
    </div>
  );
}
