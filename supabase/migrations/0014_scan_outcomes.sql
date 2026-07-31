-- ─────────────────────────────────────────────────────────────────────────────
-- Record scan attempts, not just scan successes.
--
-- scan_stats only ever got a row after a scan finished, so every failure was
-- invisible: timeouts, unreachable apps, rejected URLs, rate limits. The first
-- real traffic exposed the cost — 12 people reached /try and 4 scans were
-- recorded, with no way to see what happened to the rest.
--
-- Worse, the failures were not random. The plain-English explanation step runs
-- one model call over every finding, so the more a scan finds the longer it
-- takes, and the platform kills the function at 60s. The apps most worth
-- scanning were the ones most likely to die — which is why every recorded scan
-- so far came back clean.
--
-- So: a row is written when a scan STARTS and updated when it resolves. A row
-- still sitting at 'started' is the signal a timeout can't otherwise leave,
-- because when the function is killed no code of ours runs.
--
-- Still no URL, no IP, no account. The failure_reason is a fixed bucket, never
-- a message that could carry someone's hostname.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.scan_stats
  add column if not exists outcome text not null default 'completed',
  add column if not exists failure_reason text,
  add column if not exists resolved_at timestamptz;

-- verdict/score are unknown until a scan finishes, and never arrive for one
-- that fails. They were NOT NULL because only completions were ever written.
alter table public.scan_stats alter column verdict drop not null;
alter table public.scan_stats alter column score   drop not null;
alter table public.scan_stats alter column platform set default 'unknown';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scan_stats_outcome_check'
  ) then
    alter table public.scan_stats
      add constraint scan_stats_outcome_check
      check (outcome in ('started', 'completed', 'failed'));
  end if;
end $$;

-- The funnel query groups by outcome over a window.
create index if not exists scan_stats_outcome_idx
  on public.scan_stats (outcome, created_at desc);
