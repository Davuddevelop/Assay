-- ─────────────────────────────────────────────────────────────────────────────
-- Funnel counters.
--
-- We can see scans (scan_stats) and we can see accounts (auth.users), and
-- nothing in between. So "nobody signs up" has two completely different causes
-- that look identical from here:
--
--   a) people read the report and never press the button  → the ask is wrong
--   b) people press the button and never finish signing up → the wall is wrong
--
-- Those need opposite fixes, and guessing which one costs more than measuring.
-- This table records only that a step happened, and when. No user, no URL, no
-- IP, no session — it can answer "how many" and can never answer "who", which
-- is the same line scan_stats holds.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.funnel_events (
  id         bigint generated always as identity primary key,
  -- 'cta_click'        — pressed "Watch this app" on an anonymous report
  -- 'signup'           — finished auth and a session exists
  -- 'signup_from_scan' — that signup arrived carrying a scanned app
  event      text not null,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_event_idx
  on public.funnel_events (event, created_at desc);

alter table public.funnel_events enable row level security;

-- Same posture as scan_stats: RLS on with zero policies denies every anon and
-- authenticated request outright. Writes go through the service role; reading
-- happens in the SQL editor.
