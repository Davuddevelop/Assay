-- ─────────────────────────────────────────────────────────────────────────────
-- Legal acceptance.
--
-- Showing someone a "by continuing you agree" line is half of an agreement.
-- The half that matters later is being able to say *which wording* they saw
-- and *when* — a screenshot of today's page proves nothing about what the page
-- said the day they signed up.
--
-- One row per acceptance, never updated. A user who accepts v1 and later
-- accepts v2 has two rows, and the history is the point: overwriting a single
-- current_version column would destroy the only record that the earlier
-- agreement ever happened.
--
-- Deliberately no IP address and no user agent, which is what a boilerplate
-- consent table would collect. This product tells people it stores almost
-- nothing about them, and the user id plus a timestamp already identifies the
-- agreement uniquely — an IP would add nothing except a thing to leak.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.legal_acceptances (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- The LEGAL_VERSION constant from lib/legal.ts, e.g. '2026-08-06'.
  version     text not null,
  -- Where they accepted: 'signup' (first session) or 'reaccept' (a later
  -- version, accepted from the banner). Tells us whether an old user ever
  -- saw the new wording or merely stopped visiting.
  context     text not null default 'signup',
  accepted_at timestamptz not null default now()
);

-- The read is always "what is this user's latest version", so index for it.
create index if not exists legal_acceptances_user_idx
  on public.legal_acceptances (user_id, accepted_at desc);

-- Idempotent: signing in twice on the same version records once. Without this,
-- every page load that triggers the check could add a row.
create unique index if not exists legal_acceptances_user_version_idx
  on public.legal_acceptances (user_id, version);

alter table public.legal_acceptances enable row level security;

-- A user may read their own acceptances — they are entitled to know what they
-- agreed to and when, and a data-access request should be answerable from the
-- app rather than by hand.
create policy legal_acceptances_own_read on public.legal_acceptances
  for select using (auth.uid() = user_id);

-- No insert or update policy on purpose. Writes go through the service role in
-- lib/data/legal.ts. A record of consent that the consenting party can write
-- or amend from the browser is not evidence of anything.
