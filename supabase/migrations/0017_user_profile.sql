-- ─────────────────────────────────────────────────────────────────────────────
-- The two answers from first sign-in.
--
-- Deliberately two columns and no more. The temptation with a table called
-- "profile" is to keep adding to it — company size, role, team, referral
-- source — and every one of those is a field somebody abandons a signup over
-- while telling us nothing that changes a pixel. If a third column is ever
-- proposed, the test is CLAUDE.md §11: does the answer change what the
-- product does? If not, it doesn't go here.
--
-- `platform` matters beyond personalization. lib/scan/platform.ts only
-- classifies on evidence a page cannot fake, which is correct and which leaves
-- ~92% of scan_stats rows reading 'unknown'. The owner of the app is the only
-- trustworthy source for that, and this is where they tell us.
--
-- One row per user, upserted. There is no history worth keeping here: unlike
-- legal_acceptances, nobody will ever need to prove which builder someone said
-- they used last March.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_profile (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- 'lovable' | 'bolt' | 'replit' | 'v0' | 'other' — see lib/onboarding.ts.
  platform   text,
  -- 'self' | 'client' | 'company'.
  audience   text,
  -- They pressed Skip. Without this there is no way to tell "hasn't answered
  -- yet" from "declined", so the questions would reappear on every visit for
  -- anyone who declined — which turns one polite ask into nagging.
  skipped    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profile enable row level security;

-- A user may read their own row. Nothing here is sensitive, but the default
-- for anything keyed by user_id in this schema is owner-scoped, and a table
-- that quietly opts out of that convention is the one nobody re-checks later.
create policy user_profile_own_read on public.user_profile
  for select using (auth.uid() = user_id);

-- No insert or update policy: writes go through the service role in
-- lib/data/profile.ts, after the server action has validated the values
-- against the allowed sets. Letting the browser write directly would mean
-- platform could be any string at all, and this column is a grouping key for
-- everything we might publish about how these builders ship.
