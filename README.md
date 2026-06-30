# Assay

A security checkpoint for apps built with **Lovable, Bolt, Replit, and v0**. You
paste the link to an app **you own**; Assay scans it for the security holes
vibe-coded apps ship with — an exposed key in the browser, a Supabase database
left open to the public, missing protections — explains each one in plain
language, and hands you the **exact prompt to paste back into your builder** to
fix it. Clean apps earn a **hallmark**: ✓ Safe to publish or ⚠ Held, with a
public, shareable badge.

This repository holds the Assay web frontend **and** the scan-engine backend.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui conventions; GSAP for motion
- Fonts: Geist (display/body), JetBrains Mono (code/labels), Instrument Serif (accent)
- Backend: Supabase (Postgres + RLS), Inngest (durable jobs), Anthropic SDK
  (Claude Sonnet 4.6 for plain-language explanations)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

- `/` — landing page
- `/sample` — a seeded demo report (works with no keys — the demo never fails)
- `/scan` — submit a URL → confirm ownership → scan
- `/showcase` — the design system: tokens, type roles, and the components

## Checks

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run test        # vitest (scan patterns, SSRF guard, scoring, detection)
npm run build       # production build
```

## Backend — the scan engine

A scan is a durable async job. The user submits a URL for an app they've
verified they own; Assay fetches it the way the public does, runs detection-only
checks, scores the result, and turns raw findings into plain-language fixes.

### Architecture

```
/scan (URL + ownership) ─▶ createScan ─▶ Inngest event (app/scan.requested)
                                              │
                    ┌──────────────────────────┘
                    ▼
        inngest/functions/run-scan.ts (durable, step-by-step)
          1. mark the scan running
          2. fetch the app, SSRF-guarded     (lib/scan/fetch.ts)
          3. run detection-only checks        (lib/scan/run.ts):
               • exposed secrets in HTML + JS bundles   (lib/scan/patterns.ts — redacted)
               • Supabase RLS exposure, read-only probe  (lib/scan/supabase-rls.ts)
               • missing security headers                (lib/scan/headers.ts)
          4. score + verdict                  (lib/scan/score.ts, pure)
          5. plain-language + paste-back fixes (lib/anthropic/explain.ts, Sonnet 4.6)
          6. persist findings + score + verdict
```

The Claude layer (`lib/anthropic/explain.ts`) turns each raw finding into
`{ title, plain_explanation, fix_prompt, manual_steps[] }` via structured
output (`zodOutputFormat`). Without an `ANTHROPIC_API_KEY` it falls back to the
raw finding text, so scans still complete. A seeded **demo report**
(`lib/scan/demo.ts`, surfaced at `/sample`) renders end-to-end with no keys at
all.

### Ethics & safety (non-negotiable, built in)

- **Scan only apps you own.** Every non-demo scan requires **ownership
  verification**: the user adds a one-time `<meta name="assay-verify"
  content="…">` tag to their app and we re-fetch to confirm it
  (`lib/data/scans.ts → verifyOwnership`). The UI states "Assay only scans apps
  you own."
- **SSRF-guarded fetching** (`lib/scan/fetch.ts`, `lib/scan/ssrf.ts`): only
  public http(s) targets; localhost and private/loopback/link-local IP ranges
  are rejected, every resolved address is checked (anti-DNS-rebinding), and
  responses are bounded by time and size.
- **Never store secrets.** Secret detection reports the *type* and a **redacted**
  location only — the raw value is never persisted or logged
  (`lib/scan/patterns.ts → redact`).
- **Detection only.** No exploit payloads. The Supabase check is a single
  bounded, read-only probe that uses only whether a table returns rows
  unauthenticated (row *count*, never the data) to decide if RLS is off.
- **Rate-limited.** Each scan atomically consumes one unit of the user's monthly
  allowance (`lib/usage.ts → consumeScanUsage` → the `consume_scan_usage`
  Postgres function), enforced in `scan/actions.ts → launch()` before any fetch;
  over the limit redirects to `/scan?error=limit`.
- **Row-Level Security** on every user-facing table; jobs use the service role.
  Public badge reports are served by token via the service role (no public RLS).
- **Security headers on Assay itself.** `next.config.ts` sets CSP (hardening
  directives), HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` on every route — the same headers
  Assay grades others on, so it passes its own scan.

### Auth, dashboard & pricing

- **Auth** is Supabase Auth → GitHub OAuth, used **only to sign you in** — Assay
  requests no repository access (`lib/auth.ts`, `middleware.ts`, `app/auth/*`).
- **Dashboard** (`/dashboard`) lists your scans; `/scan/[id]` is the report
  (findings as plain-language cards, the paste-back fix with a copy button, the
  score, and the badge box when certified); `/badge/[token]` is the public,
  shareable "safe to publish" report.
- **Pricing** is a single catalog (`lib/plans.ts` — Free / Pro $19 / Team $99)
  surfaced on `/pricing`, the landing page, and the dashboard. Limits are
  enforced by the usage meter today; **Stripe billing and continuous re-scans are
  the next phase** (catalog + enforcement already in place).

### Setup

1. **Environment** — copy `.env.example` to `.env.local` and fill it in. The only
   key the scan engine needs is `ANTHROPIC_API_KEY` (and Supabase); generate the
   encryption key with `openssl rand -hex 32`.

2. **Supabase** — create a project, apply the base schema (`supabase db push`),
   then run **`supabase/migrations/0003_scans.sql`** (the `scans`,
   `scan_findings`, `ownership_proofs`, and `badges` tables) and
   **`supabase/migrations/0004_scan_usage.sql`** (the per-user scan meter +
   `consume_scan_usage`) in the Supabase SQL editor. Both add RLS.

3. **Supabase GitHub auth** — Authentication → Providers → enable GitHub with an
   OAuth client id/secret, and add `<your-site>/auth/callback` as a redirect URL.
   Set the Site URL + redirect wildcard to your deployed origin.

4. **Inngest** — in dev, run `npx inngest-cli@latest dev` (it discovers
   `/api/inngest`). In prod, set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.

5. **Anthropic** — set `ANTHROPIC_API_KEY` for the plain-language fixes.

### Go-live checklist (each needs your keys)

- [ ] Supabase project created; base schema + `0003_scans.sql` + `0004_scan_usage.sql`
      applied; GitHub provider on.
- [ ] `ANTHROPIC_API_KEY` set; Inngest keys set; deployed (Vercel).
- [ ] **Verify:** open `/sample` → the seeded demo report renders. Sign in →
      `/scan` → paste an app you own → add the meta tag → verify → the scan runs
      (Inngest `run-scan`) → `/scan/[id]` shows findings with plain-language
      fixes; a certified app can mint a `/badge/[token]` report. `scan_usage`
      increments; the 101st scan in a month redirects to `/scan?error=limit`.
- [ ] **Self-check:** `curl -I https://<your-host>/` shows the six security
      headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy).

### Roadmap

**Done:** the scan engine (secrets, Supabase RLS, headers), the plain-language +
paste-back fix generator, scoring, the certified badge + public report, demo
mode, auth, the scans dashboard, and the pricing catalog + enforcement. **Next:**
continuous re-scans on every change and Stripe checkout/billing.

## What's built

Frontend: the design system, the signature `HallmarkStamp`, the vibe-coder
landing page, the scan flow, the report, and the public badge. Backend: the scan
engine and plain-language fix generator described above, fully typed and
unit-tested; the live gates need your Supabase + Anthropic + deploy credentials.
