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
              5. THREE check sources, aggregated:
                   • security scan   (lib/security/scan.ts — inline, deterministic)
                   • AI review       (lib/anthropic/review.ts, Sonnet 4.6) with
                                     repo context retrieved via embeddings
                                     (lib/embeddings, pgvector)
                   • sandboxed tests (lib/sandbox → E2B, off our infra)
              6. decide the hallmark            (lib/verdict.ts, pure)
              7. persist findings + verdict
              8. post Check Run + PR comment    (lib/github/{checks,comments}.ts)
```

The AI review and sandbox test run execute as parallel durable steps; each
source degrades gracefully when its optional dependency (Voyage embeddings /
E2B sandbox) isn't configured. Installations are kept in sync by
`inngest/functions/sync-install.ts` (encrypted token + repos), which also
enqueues `index-repo` to embed each repo for retrieval.

### Auth, dashboard & pricing

- **Auth** is Supabase Auth → GitHub OAuth (`lib/auth.ts`, `middleware.ts`,
  `app/auth/*`). On sign-in the user's GitHub account claims the installations
  it owns (`owner_user_id`), so RLS scopes everything to them.
- **Dashboard** (`/dashboard`, `/repos/[id]`, `/checks/[id]`, `/rules`) reads
  real data through the user-scoped client (`lib/data/queries.ts`) — repos with
  their current hallmark, check history, findings, and a plain-language rules
  editor.
- **Pricing** is a single catalog (`lib/plans.ts` — Free / Pro $19 / Team $99)
  surfaced on `/pricing`, the landing page, and the dashboard (plan badge +
  usage meter + upgrade nudge). Limits are enforced by the usage meter today;
  **Stripe checkout/billing is the next phase** (the catalog and enforcement
  are already in place).

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

   This applies `0001_init.sql` (tables, RLS, `consume_usage`) and
   `0002_embeddings.sql` (HNSW index + `match_embeddings`).

3. **GitHub App** — register at <https://github.com/settings/apps>. Permissions:
   Checks (write), Pull requests (write), Contents (read), Metadata (read).
   Subscribe to **Pull request**, **Installation**, and **Installation
   repositories** events. Set the webhook URL to
   `https://<your-host>/api/webhooks/github` and the webhook secret to
   `GITHUB_WEBHOOK_SECRET`. Put the App id, private key, client id/secret, and
   `NEXT_PUBLIC_GITHUB_APP_SLUG` in the env.

4. **Supabase GitHub auth** — Authentication → Providers → enable GitHub with the
   OAuth client id/secret, and add `<your-site>/auth/callback` as a redirect URL.

5. **Inngest** — in dev, run the dev server (`npx inngest-cli@latest dev`) which
   discovers `/api/inngest`. In prod, set `INNGEST_EVENT_KEY` and
   `INNGEST_SIGNING_KEY`.

6. **Anthropic** — set `ANTHROPIC_API_KEY`.

7. **Optional** — `VOYAGE_API_KEY` (repo-aware review) and `E2B_API_KEY`
   (sandboxed test runs). Both degrade gracefully when unset.

### Go-live checklist (each needs your keys)

- [ ] Supabase project created, `supabase db push` applied, GitHub provider on.
- [ ] GitHub App registered + installed on a test repo; webhook reachable.
- [ ] `ANTHROPIC_API_KEY` set. (Optional: `VOYAGE_API_KEY`, `E2B_API_KEY`.)
- [ ] Deploy (Vercel) + Inngest keys set.
- [ ] **Verify:** sign in with GitHub → dashboard shows your repo. Open a PR →
      webhook `202` → Inngest runs `run-check` → security + AI review (+ tests if
      E2B on) → the PR gets an **Assay** Check Run + comment (✓ Assayed / ⚠ Held).
      `usage` increments; the dashboard usage meter moves.

### Roadmap

**Done:** auth, the full check pipeline (security scan, repo-aware AI review,
sandboxed tests), real dashboard, pricing catalog + enforcement. **Next:** Stripe
checkout, the customer portal, and subscription webhooks that set
`installations.plan` (the catalog, limits, and every pricing surface already
exist).

## What's built

Frontend: the design system, the signature `HallmarkStamp`, the landing page,
and stubbed login/dashboard. Backend: the Phase 0–3 verdict engine described
above, fully typed and unit-tested; the live gates need your GitHub App +
Supabase + deploy credentials.
