# Assay

An independent checkpoint for AI-written code. Assay connects to your GitHub and,
on every change, runs your tests, a security scan, and a review against your own
rules — then strikes a **hallmark**: ✓ Assayed (sound) or ⚠ Held (looks right, but
breaks something).

This repository holds the Assay web frontend **and** the verdict-engine backend.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui conventions
- Fonts: Geist (display/body), JetBrains Mono (code/labels), Instrument Serif (accent)
- Backend: Supabase (Postgres + RLS + pgvector), GitHub App (Octokit), Inngest
  (durable jobs), Anthropic SDK (Claude Sonnet 4.6)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

- `/` — landing page
- `/showcase` — the design system: tokens, type roles, and the components

## Checks

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run test        # vitest (verdict engine, signature, parsing, crypto, redaction)
npm run build       # production build
```

## Backend — the verdict engine

On a pull request, Assay runs a check against the changed code and posts a
verdict back to GitHub: a **Check Run** (✓ Assayed / ⚠ Held) and a single
plain-language PR comment.

### Architecture

```
GitHub PR ─▶ /api/webhooks/github ─▶ (verify signature, <1s) ─▶ Inngest event
                                                                    │
                          ┌─────────────────────────────────────────┘
                          ▼
            inngest/functions/run-check.ts (durable, step-by-step)
              1. load repo + installation
              2. enforce monthly usage limit  (lib/usage.ts → consume_usage RPC)
              3. record a running check
              4. fetch the PR diff             (lib/github/diff.ts)
              5. AI review → structured findings (lib/anthropic/review.ts, Sonnet 4.6)
              6. decide the hallmark            (lib/verdict.ts, pure)
              7. persist findings + verdict
              8. post Check Run + PR comment    (lib/github/{checks,comments}.ts)
```

Installations are kept in sync by `inngest/functions/sync-install.ts`, which
upserts the installation (with an **encrypted** access token) and its repos.

### Security properties

- The webhook **verifies the GitHub HMAC signature** and returns in well under a
  second — all real work is handed to Inngest.
- GitHub tokens are **encrypted at rest** with AES-256-GCM (`lib/crypto.ts`).
- The logger **redacts** secrets and never logs user code (`lib/log.ts`).
- The monthly check limit is **metered and enforced** before any check runs,
  atomically via the `consume_usage` Postgres function.
- Every Claude call returns **structured JSON** (a validated findings list) — no
  loose free-text parsing.
- **Row-Level Security** is enabled on every user-facing table; jobs use the
  service role.
- Webhook handling is **idempotent**: GitHub's at-least-once retries dedupe by
  delivery id, and DB writes upsert on natural keys.

### Setup

1. **Environment** — copy `.env.example` to `.env.local` and fill it in.
   Generate the encryption key with `openssl rand -hex 32`.

2. **Supabase** — create a project, then apply the schema:

   ```bash
   supabase db push        # applies supabase/migrations/0001_init.sql
   ```

   This creates the tables (installations, repos, checks, findings, embeddings,
   usage), the RLS policies, and the `consume_usage` meter function.

3. **GitHub App** — register at <https://github.com/settings/apps>. Permissions:
   Checks (write), Pull requests (write), Contents (read), Metadata (read).
   Subscribe to **Pull request**, **Installation**, and **Installation
   repositories** events. Set the webhook URL to
   `https://<your-host>/api/webhooks/github` and the webhook secret to
   `GITHUB_WEBHOOK_SECRET`. Put the App id, private key, and client id/secret in
   the env.

4. **Inngest** — in dev, run the dev server (`npx inngest-cli@latest dev`) which
   discovers `/api/inngest`. In prod, set `INNGEST_EVENT_KEY` and
   `INNGEST_SIGNING_KEY`.

5. **Anthropic** — set `ANTHROPIC_API_KEY`.

### Verifying each gate

- **Phase 0 (webhook):** install the App on a test repo and open a PR. The
  webhook should return `202` quickly; the Inngest dashboard shows a
  `github/pull_request` event.
- **Phase 1 (install sync):** after install, the `installations` and `repos`
  tables hold a row for your repo (token stored encrypted).
- **Phase 2 (pipeline):** a `checks` row appears with status `running`, then
  `completed`; `usage` increments for the month.
- **Phase 3 (verdict):** the PR gets an **Assay** Check Run and a single comment
  — ✓ Assayed for a clean change, ⚠ Held with file/line/finding for a change
  that breaks one of your rules.

### Roadmap (later phases)

Semgrep security pass (4), repo embeddings + retrieval with pgvector (5), a
sandboxed test runner (6, E2B/Modal), and Stripe-backed plan limits with a live
dashboard (7). The data model and usage meter for these already exist.

## What's built

Frontend: the design system, the signature `HallmarkStamp`, the landing page,
and stubbed login/dashboard. Backend: the Phase 0–3 verdict engine described
above, fully typed and unit-tested; the live gates need your GitHub App +
Supabase + deploy credentials.
