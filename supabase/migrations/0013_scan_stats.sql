-- ─────────────────────────────────────────────────────────────────────────────
-- Anonymous scan telemetry.
--
-- Scans run from /try were never recorded anywhere: the report was assembled in
-- memory, streamed to the browser, and discarded. So there was no way to know
-- how many scans ever ran, what they found, or whether anyone who scanned went
-- on to sign up — and no way to answer the question the product is best placed
-- to answer publicly: how often do AI-built apps actually ship an open database
-- or a leaked key?
--
-- What is deliberately NOT here: the app URL, the IP, any user id, any finding
-- detail. The URL is the one field that could identify a person's project, and
-- the privacy policy promises restraint, so this keeps only the shape of the
-- result. Nothing in this table can be traced back to a visitor, which is what
-- makes it safe to keep indefinitely and to publish aggregates from.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.scan_stats (
  id         bigint generated always as identity primary key,
  -- 'lovable' | 'bolt' | 'replit' | 'v0' | 'unknown' — which builder made it.
  platform   text not null,
  -- 'certified' | 'at_risk'
  verdict    text not null,
  score      int  not null,
  critical   int  not null default 0,
  risky      int  not null default 0,
  minor      int  not null default 0,
  created_at timestamptz not null default now()
);

-- The only read pattern: aggregate over a time window, grouped by platform.
create index if not exists scan_stats_created_idx on public.scan_stats (created_at desc);
create index if not exists scan_stats_platform_idx on public.scan_stats (platform, created_at desc);

alter table public.scan_stats enable row level security;

-- No policy at all: nobody reads this through the API. Writes go through the
-- service role, and analysis happens in the SQL editor. RLS on with zero
-- policies denies every anon/authenticated request by default, which is
-- exactly right for a table that should never be exposed.
