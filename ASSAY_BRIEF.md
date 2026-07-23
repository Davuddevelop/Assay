# Assay — Full Project Brief

> A complete context document. Paste this into a new AI chat so it understands
> exactly what Assay is, why it exists, what's built, and what's next.
> Last updated: July 2026.

---

## 1. One-line pitch

**Assay is the independent security check for apps built with AI tools like
Lovable, Bolt, Replit, and v0.** You paste your live app's URL; Assay scans it
for the security holes AI-built apps ship with, explains each one in plain
English, hands you the exact prompt to paste back into your builder to fix it,
and gives a clear verdict — safe to publish, or not yet.

The core idea in one sentence: **the tool that wrote your code can't be the one
that vouches for it.**

---

## 2. Mission & Vision

**Mission (what we do every day):**
Make it safe for anyone to ship software they didn't write.

**Vision (the world we're building toward):**
A world where every AI-built app carries a mark of trust — and Assay is the
independent standard that mark is measured against. Stripe made it safe to
*accept money* online; Assay makes it safe to *ship an app* you can't read.

**The distinction that matters:**
- The *product* is a scan → certify → watch loop. That's the wedge.
- The *company* is the trust layer for the entire AI-app economy.

---

## 3. The problem (why this exists)

Millions of non-technical people are now building real, live apps with AI
builders. They prompt an app into existence, wire it to real user accounts,
real payments, and real data — and publish it with no security background and
no idea what's exposed. The failures are concentrated and severe:

- **Open database (no Row-Level Security):** the #1 failure. Anyone on the
  internet can read every user's data — emails, phone numbers, payment IDs —
  with no login.
- **Exposed secret keys:** private API/Stripe keys shipped in the browser bundle.
- **Open file storage:** buckets of user uploads (avatars, ID scans, invoices)
  listable by anyone.
- **Missing protections:** no security headers, source maps exposing source code.

**Real, published evidence (use these — they're sourced):**
- Wiz / Lovable: ~1 in 10 Lovable apps (170 of 1,645) were leaking user data via
  missing RLS. Assigned **CVE-2025-48757**.
- RedAccess (2026): audited ~380,000 AI-built apps; ~5,000 held sensitive
  corporate data, ~2,000 exposed genuinely private data to anyone with the URL.
- Wiz / Moltbook (Jan 2026): one app leaked 1.5M API tokens + 35,000 emails
  within 3 days of launch — Supabase anon key in the browser, RLS off.
- Escape.tech: scanned 5,600 vibe-coded apps → 2,000+ vulnerabilities, 400+
  exposed secrets, 175 cases of exposed personal data.

---

## 4. Who it's for

**Primary:** people building real things on AI builders who have something to
lose — real users, real payments, real data. Not throwaway hobby apps.

**The sharpest wedge (go-to-market angle):** people building apps *for clients*
— freelancers and small agencies shipping on Lovable/Bolt. They have money,
recurring projects, and liability if they ship a leak to a paying client. For
them, an independent safety check isn't a nice-to-have, it's cover.

---

## 5. The product — what's actually built

The full flow works end to end today, deployed on Vercel (`assaysecurity.com`).

### The scan flow
1. **Paste a URL** (no login needed to try it — `/try`).
2. **Live scanning feed:** a terminal-style stream prints each real step as it
   runs — fetching the app, reading its code bundles, probing the database,
   flagging what's open, checking storage/headers, scoring. It *feels* like an
   expert tearing through the app, not a button that did nothing.
3. **The report:**
   - A verdict headline (Safe to publish / Not safe to publish — yet).
   - A safety score (0–100) and a **hallmark** stamp (Assayed / Held).
   - Each finding as a plain-English card: what it means for *you* ("anyone can
     read your users' emails right now"), a loud red **"Exposed right now · no
     login required"** strip naming the exact columns/files that are exposed, and
     the **exact prompt to paste back into your builder** to fix it (copy button),
     plus manual fallback steps.
4. **Watch this app** (the retention hook): toggle continuous monitoring — Assay
   re-scans daily and flags on the dashboard if a later change reopens a hole.

### The scan engine (`lib/scan/`) — what it checks
- **`fetch.ts`** — SSRF-safe fetching: only public http(s) targets, rejects
  private/loopback IPs, re-validates every redirect hop (no SSRF-via-redirect),
  bounded by time and size, crawls the app's JS bundles.
- **`patterns.ts`** — secret detection over HTML + bundles (Stripe keys, API
  keys, tokens). Reports type + redacted location; never stores the secret value.
- **`supabase-rls.ts`** — the flagship: detects Supabase, does a read-only,
  bounded probe to see if tables return rows with no auth (RLS off). Captures
  the exposed **column names** (schema only — never the values) so the report can
  name exactly what's exposed.
- **`storage.ts`** — same idea for Supabase Storage buckets (public file listings).
- **`exposed-files.ts`** — probes for `/.env`, `/.git/config` served publicly.
- **`headers.ts`** — missing security headers (CSP, HSTS, X-Frame-Options, etc.).
- **`score.ts`** — pure function: findings → 0–100 score + verdict. Deterministic.
- **`run.ts`** — orchestrates all checks (probes run in parallel), emits live
  progress.
- **`explain` (via `lib/anthropic/explain.ts`)** — sends the raw findings to
  Claude (Sonnet) which rewrites each into plain language + a paste-back fix
  prompt. This is the moat layer — we sell the fix, not the scary list. Falls
  back to raw text if the AI key isn't set, so a report always renders.

### Continuous re-checking (`inngest/functions/recheck-apps.ts`)
A daily cron re-scans every watched app (metered against the plan), and the
dashboard shows each watched app's latest verdict + whether the last change made
it better or worse ("a change broke something" / "fixed").

### Accounts, plans, safety
- **Auth:** Supabase Auth → GitHub OAuth (sign-in only, no repo access). OAuth
  redirect is validated against open-redirect attacks.
- **Rate limiting:** per-user burst limit + a monthly scan meter; the anonymous
  `/try` endpoint has its own IP-keyed limit.
- **Pricing catalog** (`lib/plans.ts`): Free ($0), Pro ($19/mo), Team ($99/mo).
  Limits are enforced today; **Stripe billing is not built yet.**
- **Ethics, built in:** detection only (no exploitation), redaction / schema-only
  (never stores user data or secret values), SSRF guard, rate limits, "scan only
  apps you own" framing.

---

## 6. Tech stack (for context when working on it)

- **Framework:** Next.js (App Router) + TypeScript (strict).
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` tokens), GSAP for motion.
- **Fonts:** Fraunces (serif display), Hanken Grotesk (body), JetBrains Mono
  (data/labels), Instrument Serif (italic accent).
- **Backend:** Supabase (Postgres + Row-Level Security), Inngest (durable jobs +
  cron), Anthropic SDK (Claude Sonnet for the plain-language explanations).
- **Hosting:** Vercel (auto-deploys production from the `main` branch).
- **Quality:** ~81 unit tests (Vitest), plus `typecheck`, `lint`, `knip`
  (dead-code check), and `build` all kept green.

**Verification commands:** `npm run typecheck`, `npm run lint`, `npm test`,
`npm run knip`, `npm run build`.

**Branch flow:** work happens on `claude/assay-frontend-spec-vmn3kd`; merging that
into `main` triggers the production deploy.

---

## 7. Positioning & the moat (the important strategic part)

The category is crowded — there are already a dozen+ scanners (Rafter, VibeEval,
SecureYourVibe, Vibe App Scanner, etc.), and detection itself is becoming a
commodity. The biggest threat is that **the platforms build it in for free** —
Lovable already ships "Security Checker 2.0" inside its own publish button.

**The one defensible position: independence.** A platform has a structural
conflict of interest — Lovable can't loudly tell its users "the app we just built
you is unsafe" without indicting its own product. An *independent* auditor that
works across *every* builder is something the platforms cannot credibly copy,
because copying it means admitting their own output fails. You don't trust a
restaurant's own hygiene sticker; you trust the health inspector.

So the whole product leads with **"the independent check for AI-built apps"** and
the line **"the tool that wrote your code can't be the one that vouches for it."**
That turns the biggest competitor (the platform's free scanner) from a threat
into the pitch.

---

## 8. Business model

- **Free:** the one-time scan. This is the acquisition wedge — frictionless, no
  login, shareable, viral (scan reports are the growth channel; every competitor's
  headlines come from published scans).
- **Paid (the reason to subscribe):** continuous monitoring. A one-time scan is a
  one-time job — but the founder keeps prompting changes into their app, and every
  change can reopen a hole. Assay watches it and catches the break *before the
  users do*. You're buying peace of mind that renews, not a button.

---

## 9. Honest gaps & risks (be truthful about these)

This section is deliberately unflinching — an AI helping on this should know the
real weaknesses, not just the pitch.

1. **No traction yet.** No meaningful users, no revenue, no retention data. The
   retention thesis (continuous monitoring) is currently unproven — no one has
   been shown coming back a second time. This is the single most important thing
   to fix: get real users and watch what they actually do.
2. **Detection is commoditizing.** The checks (RLS off, keys in the bundle) are
   public knowledge; the rules aren't proprietary. The defensibility has to come
   from independence + trust + being the standard, not from the scan itself.
3. **The platforms are the biggest competitor** and can bundle this for free.
   Independence is the answer, but it's a position, not a guarantee.
4. **The market may be shrinking on purpose:** Supabase and Lovable keep making
   their defaults safer. The core problem could erode over time.
5. **Willingness to pay is unproven** — the ICP (non-technical builders) is the
   hardest audience to sell security to; they don't understand or value the risk
   until it's too late. The "building for clients" wedge is the most promising fix.
6. **Dual-use risk:** a URL scanner can be used for recon by bad actors. Mitigated
   (detection-only, redaction, rate-limiting, ownership framing), but not
   eliminated. The anonymous `/try` is the most exposed surface — a planned
   mitigation is to show the verdict + counts free but require sign-in to reveal
   the specific exposed columns and the fix.

---

## 10. Roadmap / what's next

**Near-term (make it a real product + prove pull):**
- Get real users and measure retention on the "watch" feature — the #1 priority.
- Stripe billing (checkout + subscription enforcement).
- Email alerts when a watched app regresses (needs a mail provider decision).
- Polish the report page and overall UI to a "proper startup" bar.

**Medium-term (the company, not the tool):**
- Lean into the independent-auditor positioning across the product.
- A verifiable, shareable safety report for people shipping apps to clients (the
  "prove it's safe to your client" use case) — turns a grudge purchase into a
  business necessity.
- Explore becoming a *requirement* (a marketplace / client / insurer asks for an
  Assay check) — the version that's genuinely venture-scale.

---

## 11. How to talk about it (elevator version)

> "Millions of people now build real apps with AI tools like Lovable and Bolt —
> with real users and real payments — and ship them with huge security holes,
> because they can't read the code. Assay is the independent check: paste your
> app's URL, and in plain English it tells you exactly what's exposed and the
> exact fix. The tool that built your app can't be the one that certifies it —
> that's us. The free scan gets people in; they pay us to keep watching the app
> as they keep changing it. Long term, Assay is the trust standard for software
> built by people who didn't write the code."

---

*Current state: full scan flow live on Vercel; ~81 tests green; auth, scanning,
plain-language fixes, live feed, continuous monitoring, and pricing catalog all
built. Not yet built: Stripe billing, email alerts, real user traction.*
