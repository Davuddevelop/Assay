# Assay

The **independent** security check for apps built with **Lovable, Bolt, Replit,
and v0**. The tool that wrote your code can't be the one that vouches for it —
Assay is the outside check. You paste the link to an app **you own**; Assay
scans it for the security holes AI-built apps ship with — an exposed key in the
browser, a Supabase database or storage bucket left open to the public, missing
protections — names the exact data anyone can read right now, explains each
issue in plain language, and hands you the **exact prompt to paste back into
your builder** to fix it. Clean apps earn a **hallmark**: ✓ Safe to publish or
⚠ Held.

This repository holds the Assay web frontend **and** the scan-engine backend.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui conventions; GSAP for motion
- Fonts: Fraunces (editorial serif display), Hanken Grotesk (body), JetBrains Mono (code/labels), Instrument Serif (accent)
- Backend: Supabase (Postgres + RLS), Inngest (durable jobs), Anthropic SDK
  (Claude Sonnet 4.6 for plain-language explanations)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

- `/` — landing page
- `/sample` — a seeded demo report (works with no keys — the demo never fails)
- `/scan` — submit a URL → scan runs immediately (no ownership-proof gate)
- `/showcase` — the design system: tokens, type roles, and the components

## Checks

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run test        # vitest (scan patterns, SSRF guard, scoring, detection)
npm run build       # production build
npm run knip        # unused files, exports, and dependencies
```

`/ponytail` (Claude Code custom command, `.claude/commands/ponytail.md`) reviews
a target — or the current diff by default — and cuts anything that isn't earning
its weight: needless abstraction, dead defensive code, comments explaining WHAT
instead of WHY. Behavior stays identical; only the shape gets smaller.

## Backend — the scan engine

A signed-in scan runs inline (no ownership-proof gate — a scan only reads what
the app already serves publicly). Assay fetches it the way the public does,
runs detection-only checks, scores the result, and turns raw findings into
plain-language fixes. The same pipeline also runs as a durable Inngest job for
the watch-list's scheduled re-checks.

### Architecture

```
/scan (URL) ──────────────────▶ createScan ─▶ executeAndSaveScan()  ← called inline
watch-list cron (app changed) ─▶ createScan ─▶ app/scan.requested   ← Inngest event
                                                      │
                                                      ▼
                                    inngest/functions/run-scan.ts
                                    also calls executeAndSaveScan()

executeAndSaveScan()  (lib/scan/execute.ts — the one shared pipeline)
  1. fetch the app, SSRF-guarded      (lib/scan/fetch.ts)
  2. run detection-only checks         (lib/scan/run.ts):
       • exposed secrets in HTML + JS bundles   (lib/scan/patterns.ts — redacted)
       • Supabase RLS exposure, read-only probe  (lib/scan/supabase-rls.ts)
       • missing security headers                (lib/scan/headers.ts)
  3. score + verdict                   (lib/scan/score.ts, pure)
  4. plain-language + paste-back fixes (lib/anthropic/explain.ts, Sonnet 4.6)
  5. persist findings + score + verdict
```

The Claude layer (`lib/anthropic/explain.ts`) turns each raw finding into
`{ title, plain_explanation, fix_prompt, manual_steps[] }` via structured
output (`zodOutputFormat`). Without an `ANTHROPIC_API_KEY` it falls back to the
raw finding text, so scans still complete. A seeded **demo report**
(`lib/scan/demo.ts`, surfaced at `/sample`) renders end-to-end with no keys at
all.

### Ethics & safety (non-negotiable, built in)

- **Scan only apps you own.** No ownership-proof gate — a scan only reads what
  the app already serves publicly (its HTML, JS bundles, and response
  headers), so there's nothing private to prove. The UI states this plainly
  ("Read-only. We never store secrets and never change your app.").
- **SSRF-guarded fetching** (`lib/scan/fetch.ts`, `lib/scan/ssrf.ts`): only
  public http(s) targets; localhost and private/loopback/link-local IP ranges
  are rejected, every resolved address is checked (anti-DNS-rebinding), and
  responses are bounded by time and size.
- **Never store secrets.** Secret detection reports the *type* and a **redacted**
  location only — the raw value is never persisted or logged
  (`lib/scan/patterns.ts → redact`).
- **Detection only.** No exploit payloads. The Supabase RLS check
  (`lib/scan/supabase-rls.ts`) and the Storage-bucket check
  (`lib/scan/storage.ts`) are each a single bounded, read-only probe that uses
  only whether a table/bucket returns rows unauthenticated (a row/object
  *count*, never the data) to decide if access control is off.
- **Rate-limited twice.** A per-user burst guard (`lib/rate-limit.ts`, 6/min)
  on top of the monthly allowance (`lib/usage.ts → consumeScanUsage` → the
  `consume_scan_usage` Postgres function) — both enforced in
  `scan/actions.ts → launch()` before any fetch; over either limit redirects
  to `/scan?error=burst` or `/scan?error=limit`. The anonymous `/try` endpoint
  has its own IP-keyed limit.
- **Row-Level Security** on every user-facing table; only the owner can read
  their own scans, findings, and watched apps. Background jobs use the
  service role.
- **Security headers on Assay itself.** `next.config.ts` sets CSP (hardening
  directives), HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` on every route — the same headers
  Assay grades others on, so it passes its own scan.

### Auth, dashboard & pricing

- **Auth** is Supabase Auth → GitHub OAuth, used **only to sign you in** — Assay
  requests no repository access (`lib/auth.ts`, `middleware.ts`, `app/auth/*`).
  The OAuth callback's post-login redirect is validated
  (`lib/safe-redirect.ts → safeNext`) against open-redirect / host-confusion
  payloads before it's used.
- **Dashboard** (`/dashboard`) lists your scans and any watched apps; `/scan/[id]`
  is the report (findings as plain-language cards, the paste-back fix with a
  copy button, the score, and the "Watch this app" toggle for continuous
  re-checking).
- **Pricing** is a single catalog (`lib/plans.ts` — Free / Pro $19 / Team $99)
  surfaced on `/pricing`, the landing page, and the dashboard. Limits are
  enforced by the usage meter today; **Stripe billing and continuous re-scans are
  the next phase** (catalog + enforcement already in place).

### Setup

1. **Environment** — copy `.env.example` to `.env.local` and fill it in. The only
   key the scan engine needs is `ANTHROPIC_API_KEY` (and Supabase).

2. **Supabase** — create a project, apply the base schema (`supabase db push`),
   then run **`supabase/migrations/0003_scans.sql`** (the `scans`,
   `scan_findings`, and `ownership_proofs` tables),
   **`supabase/migrations/0004_scan_usage.sql`** (the per-user scan meter +
   `consume_scan_usage`), **`supabase/migrations/0005_monitored_apps.sql`**
   (the watched-apps list behind daily re-checks),
   **`supabase/migrations/0007_email_log.sql`** (the alert send-log + dedupe),
   and **`supabase/migrations/0008_subscriptions.sql`** (the per-user plan the
   Stripe webhook writes) in the Supabase SQL editor. All add RLS.

3. **Supabase GitHub auth** — Authentication → Providers → enable GitHub with an
   OAuth client id/secret, and add `<your-site>/auth/callback` as a redirect URL.
   Set the Site URL + redirect wildcard to your deployed origin.

4. **Inngest** — in dev, run `npx inngest-cli@latest dev` (it discovers
   `/api/inngest`). In prod, set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.

5. **Anthropic** — set `ANTHROPIC_API_KEY` for the plain-language fixes.

6. **Resend** (optional) — set `RESEND_API_KEY` + a verified `EMAIL_FROM` for
   regression alerts + the weekly watch digest. Without it, monitoring still
   works; it just doesn't email.

7. **Stripe** (optional) — create Pro/Team products, set `STRIPE_SECRET_KEY`,
   `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`, and add the webhook endpoint
   `<site>/api/webhooks/stripe` (→ `STRIPE_WEBHOOK_SECRET`). Without it everyone
   is Free and upgrades are disabled. Free watches 1 app (dashboard-only);
   Pro/Team watch unlimited apps + get email alerts. Plan is enforced in scan
   metering, watch caps, and alert gating.

### Go-live checklist (each needs your keys)

- [ ] Supabase project created; base schema + `0003_scans.sql` +
      `0004_scan_usage.sql` + `0005_monitored_apps.sql` applied; GitHub provider on.
- [ ] `ANTHROPIC_API_KEY` set; Inngest keys set; deployed (Vercel).
- [ ] **Verify:** open `/sample` → the seeded demo report renders. Sign in →
      `/scan` → paste an app you own → the scan runs (Inngest `run-scan`) →
      `/scan/[id]` shows findings with plain-language fixes. Flip **Watch this
      app** → a `monitored_apps` row appears and the daily `recheck-apps` cron
      (06:00 UTC) queues a re-scan; the dashboard shows the watched app with its
      delta. `scan_usage` increments; the 101st scan in a month redirects to
      `/scan?error=limit`.
- [ ] **Self-check:** `curl -I https://<your-host>/` shows the six security
      headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy).

### Roadmap

**Done:** the scan engine (secrets, Supabase RLS, public Storage buckets,
headers, exposed files), the plain-language + paste-back fix generator,
scoring, demo mode, auth (with a hardened OAuth redirect and a per-user burst
limit on top of the monthly meter), the scans dashboard, the pricing catalog +
enforcement, and continuous re-checking (watch an app → daily re-scan →
regression flag on the dashboard). **Next:** email alerts on regression and
Stripe checkout/billing.

## What's built

Frontend: the design system, the signature `HallmarkStamp`, the vibe-coder
landing page, the scan flow, and the report. Backend: the scan engine and
plain-language fix generator described above, fully typed and unit-tested; the
live gates need your Supabase + Anthropic + deploy credentials.
