-- Global rate limiter — the in-memory limiter (lib/rate-limit.ts) is per
-- serverless instance, so under real traffic it barely limits anything and the
-- scanner becomes a free outbound-fetch proxy. This is a Postgres-backed fixed
-- window counter shared across every instance: one atomic upsert per call.
--
-- Keyed by an arbitrary string (e.g. "try:1.2.3.4" or "scan:<user>") + the
-- window bucket. Old buckets for a key are pruned on write so the table can't
-- grow unbounded. Service-role only (locked RLS); writes via the SECURITY
-- DEFINER function below.
create table if not exists public.rate_limits (
  key          text   not null,
  window_start bigint not null, -- unix epoch (seconds) of the window bucket
  count        integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;

-- Returns true and records the hit if the key is under its limit for the
-- current window; false (no increment) once the limit is reached. Race-free via
-- the row lock, same pattern as consume_scan_usage.
create or replace function public.consume_rate_limit(
  p_key             text,
  p_limit           integer,
  p_window_seconds  integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket bigint;
  v_count  integer;
begin
  v_bucket := (floor(extract(epoch from now()) / p_window_seconds))::bigint * p_window_seconds;

  -- Drop this key's stale windows so the table stays small.
  delete from public.rate_limits
  where key = p_key and window_start < v_bucket;

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_bucket, 0)
  on conflict (key, window_start) do nothing;

  select count into v_count
  from public.rate_limits
  where key = p_key and window_start = v_bucket
  for update;

  if v_count >= p_limit then
    return false;
  end if;

  update public.rate_limits
  set count = count + 1
  where key = p_key and window_start = v_bucket;

  return true;
end;
$$;
