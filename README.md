# Assay

An independent checkpoint for AI-written code. Assay connects to your GitHub and,
on every change, runs your tests, a security scan, and a review against your own
rules — then strikes a **hallmark**: ✓ Assayed (sound) or ⚠ Held (looks right, but
breaks something).

This repository is the Assay web frontend.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui conventions
- Fonts: Fraunces (display), Inter (body), JetBrains Mono (code/labels)

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
npm run build       # production build
```

## What's built

This is the first pass: design tokens, fonts, the `Button` and the signature
`HallmarkStamp`, the site nav, a components showcase, and the static landing page.
Login/dashboard/checks/rules/pricing/docs and Supabase auth follow in later passes.
