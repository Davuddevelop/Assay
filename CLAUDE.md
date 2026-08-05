# CLAUDE.md — Assay

Context and working rules for Claude Code on this repo. Read this before any task.

## 1. What this is

Assay is an independent security check for apps built with AI tools (Lovable, Bolt, Replit, v0). A user pastes a live app URL. Assay scans what's publicly reachable, explains each issue in plain English, and generates the exact prompt to paste back into their builder to fix it. Clean apps earn the hallmark.

The core argument: **the tool that wrote your code can't be the one that vouches for it.** Independence is the product, not a feature.

Live: assaysecurity.com · Founder: solo, non-professional-engineer background, learning security in depth alongside building this.

## 2. Stage — this is the most important section

This is a **pre-traction startup**, not a mature product. Roughly 50 people have run a scan. There is no revenue. Retention is unproven.

That means the optimization target is **learning speed**, not code perfection. Concretely:

- Shipping something real this week beats architecting something ideal for next month. If a change can go out today at 80% quality, prefer it over a two-week version at 100%.
- Don't build for scale we don't have. No premature abstraction, no microservices, no elaborate caching layers, no multi-region anything. Optimize when something is actually slow for actual users, not before.
- Prefer boring, proven tools over interesting ones. Every novel dependency is a maintenance cost a solo founder pays alone.
- Reversible decisions should be made fast; irreversible ones slowly. Ask which kind it is before deliberating.
- If a feature would take more than ~2 days, stop and ask whether a cheaper version tests the same hypothesis. Usually it does.

When a task could be done "properly" or "quickly," default to quickly and say what the tradeoff was — but never for security, auth, or anything touching user data (see §5).

## 3. Strategy — the constraints that shape what we build

These come from real competitive research. Respect them; they're not preferences.

**Narrow beats broad.** The category is crowded (Lovable ships its own scanner; CodeRabbit, Qodo, Aikido, Snyk all exist and are far better funded). Assay cannot win on breadth of detection. It wins by being excellent at a small number of things for a specific person.

- **Depth first, breadth later.** Do NOT add support for a new platform or a new vulnerability class until the current ones (Supabase RLS, exposed secrets, open storage, headers) are genuinely excellent and well-tested. Suggesting "we could also scan X" is usually the wrong instinct at this stage.
- **The target user is a freelancer or small agency shipping client work** — someone with liability, not a hobbyist checking their weekend project. When a design decision is ambiguous, ask "does this help someone prove safety to a paying client?"
- **The client-facing shareable report is the strategic artifact**, because it's the one thing a platform's own built-in scanner structurally can't be. Treat it as first-class.
- **Speed and zero friction are the moat** against enterprise players. No login to get a first verdict. If any flow starts requiring a sales call or a 10-step setup, we've lost our advantage.

## 4. Product principles

- **Plain English, always.** The user cannot read code. Never surface CVSS scores, raw scanner output, or security jargon without translation. "Anyone can currently read every user's email address" beats "BOLA on /users."
- **Sell the fix, not the fear.** Every finding must come with an actionable fix — ideally a paste-back prompt. A scary list with no remedy is a worse product than no scan.
- **Never overclaim.** Assay is not a pentest and must never imply it is. It checks for known, mechanical misconfigurations. If copy anywhere starts implying "certified secure" or equivalence to a professional audit, flag it and push back — that's both a credibility and a liability problem.
- **Honesty about limits is a feature.** If the product doesn't check behind login yet, say so plainly in the UI. Users trust a tool that names its own gaps.

## 5. Non-negotiables (never trade these for speed)

- **Only scan apps the user owns.** Ownership verification (meta tag) must be enforced, not optional. Never build anything enabling mass-scanning of third-party apps.
- **Detection only, never exploitation.** No exploit payloads, no data modification, no exfiltration. Read-only, bounded probes.
- **Never store secrets or user data.** Store the type and a redacted location only ("Stripe key in bundle.js"). When proving a database is readable, mask values in memory and never persist them.
- **SSRF protection stays.** Public http(s) targets only, reject private/loopback IPs, re-validate every redirect hop.
- **Rate limit everything**, especially the anonymous `/try` endpoint.
- **Meter LLM spend.** Cost per scan can outrun a free tier fast — enforce limits before running, not after.

If a request would violate any of the above, say so and stop. These are not negotiable for demos, deadlines, or investor meetings.

## 6. Design and UX rules

The bones (copy, layout, IA) are good. The recurring failure mode is **looking generically AI-generated**.

- **No generic AI-gradient backgrounds.** Purple/blue radial mesh glows are the visual signature of AI-built sites. Avoid them. Visual interest should come from typography, restraint, and the gold/hallmark accent tied to the actual brand metaphor.
- **One accent use per screen.** Pick a single focal element for the accent color. If accent is on the CTA, the pills, the links, and the italic word simultaneously, nothing reads as important.
- **Typography must be identical across pages.** Fraunces (display), Hanken Grotesk (body), JetBrains Mono (labels/data), loaded once via `next/font`. No per-component overrides, no silent system-font fallbacks. Verify computed `font-family` in DevTools when in doubt.
- **Every state must be designed:** loading, empty, error, and limit-reached. A limit-reached state must be an unmissable modal or banner explaining what happened and the path forward — never a silent failure, a disabled button, or a tiny toast.
- **The dashboard deserves the same design bar as the marketing pages.** It's what returning users see most.
- **Mobile is not optional.** Verify at 375px width before calling anything done.
- **Accessibility floor:** visible keyboard focus, AA contrast on dark, `prefers-reduced-motion` respected.

## 7. Tech stack

Next.js (App Router) + TypeScript (strict) · Tailwind CSS v4 · GSAP for motion · Supabase (Postgres + RLS + Auth: email magic link, GitHub OAuth) · Inngest (durable jobs + cron) · Anthropic SDK (Claude Sonnet, for plain-language explanations) · Vercel hosting.

Scan engine lives in `lib/scan/` — each check is an isolated module (`fetch`, `patterns`, `supabase-rls`, `storage`, `exposed-files`, `headers`, `score`, `run`). New checks implement the existing interface; don't restructure orchestration to add one.

Verify before declaring done: `npm run typecheck`, `npm run lint`, `npm test`, `npm run knip`, `npm run build` — all green.

Branch flow: work on feature branches; merging to `main` triggers the production deploy. Never push directly to `main` without the checks passing.

## 8. How to work with me

I'm 14, a solo founder, and deliberately building real technical depth — I code primarily with AI assistance today and I'm actively working to change that. So:

- **Teach while you build.** When you make a non-obvious decision, say why in one line. When I'd learn more by writing it myself, say so and let me try first.
- **Don't let me merge what I can't explain.** If I approve something I clearly don't understand, point that out rather than shipping it.
- **Be direct.** No flattery. If an idea is weak, say it's weak and why. If I'm about to do something dumb, tell me plainly. I'd rather be corrected than agreed with.
- **Push back on scope creep** — I'm prone to it. If I ask for a feature that doesn't serve the current stage (§2) or the narrow wedge (§3), say so before building it.
- **Ask before assuming** on anything ambiguous or expensive to reverse. One clarifying question beats a wasted day.
- **Keep outputs concise.** Show the decision and the tradeoff, not a wall of explanation.

## 9. Current priority

**Traction, not features.** The bottleneck is real users and retention data, not missing functionality. Before building anything new, the honest question is: does this help someone use Assay for the first time, or come back a second time? If not, it probably shouldn't be built this week.

## 10. Positioning (settled 2026-08-05)

The wedge is **the argument, not the check list.** Competitors (Vibe App Scanner, VibeEval) already have more checks, MCP, badges and monitoring. We cannot win breadth and must not try. What they structurally cannot have is the position: a platform checking its own output is not an outside opinion.

- The home page leads with *"The tool that built your app can't be the one that clears it."* Checks are evidence, never the headline.
- The narrow beachhead is **the client-handoff moment** (`/client-handoff`) — not "agencies", which both competitors already claim. The moment the app is finished and the invoice is about to go out is where an independent check is worth money.
- `/gdg` is the noindex variant for personal outreach. Delete the route if the angle dies.

**Proof rules, absolute:** no invented testimonials, no rounded-up counts. `components/landing/social-proof.tsx` ships an empty `QUOTES` array and renders `null`. The scan counter is read live and hidden below `MIN_SCANS_TO_SHOW`. `scan_stats` stores no URL, IP or user id, so it *cannot* separate founder testing from real users — the number is labelled "scans run" and must never be called customers or real users.

## 11. Onboarding questions — scope limit

Two questions maximum at first sign-in, and each must **change something real** or it's a survey wearing a personalization costume.

1. **What do you build with?** — Lovable / Bolt / Replit / v0 / Something else.
   Changes: prefills the scan form, and fixes the fact that 92% of scans record `platform = 'unknown'`, which currently makes the telemetry table unable to answer its own core question.
2. **Who is it for?** — My own projects / Client work / My company.
   Changes: *client work* surfaces the PDF report and `/client-handoff` first; *own projects* surfaces monitoring first.

Never ask company size, role, budget, or "how did you hear about us." None of them change a pixel, and at this stage every extra field is a person who doesn't finish signing up.

**Stage check before building this:** there is ~1 signed-in user. The bottleneck is people signing in at all, not what happens after (§9). Build the two questions only if they take under half a day; otherwise the platform prefill alone is the part that pays for itself.

## 12. Scanning things we don't own

The ownership gate is a checkbox, not a check. That means it is currently possible to scan `google.com`, and someone did. Two consequences:

- **§5 is aspirational, not enforced.** Either implement the meta-tag verification or amend §5 to say what is actually true. An unenforced non-negotiable is worse than an honest limit.
- **Never validate the scanner against a site we don't own.** A result on `google.com` proves nothing about whether Assay works on the apps it is for — Google has no Supabase, no exposed secrets, and its `AIza` keys are deliberately public. Test against a deliberately-vulnerable app we control (`lib/scan/demo.ts` is the fixture).
