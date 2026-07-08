-- ─────────────────────────────────────────────────────────────────────────────
-- Assay pivot — scan rate limiting.
--
-- The original `usage` meter (0001_init.sql) keys on install_id with a FK to
-- `installations`, so it can't meter scans (a scan has no installation). This
-- adds a user-keyed meter for scans, with the same atomic consume_*  pattern so
-- the read-modify-write is race-free. Enforced before a scan launches; writes
-- happen via the service role.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.scan_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  month      text not null,                         -- 'YYYY-MM' (UTC)
  count      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists scan_usage_user_idx on public.scan_usage (user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.scan_usage enable row level security;

-- The owner can read their own meter; writes go through the service role.
drop policy if exists "scan_usage: owner can read" on public.scan_usage;
create policy "scan_usage: owner can read"
  on public.scan_usage for select
  using (user_id = auth.uid());

-- ── Atomic consume ────────────────────────────────────────────────────────────
-- Returns true and records the scan if the user is under their monthly limit;
-- false (no increment) once the limit is reached.
create or replace function public.consume_scan_usage(
  p_user_id uuid,
  p_month   text,
  p_limit   integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.scan_usage (user_id, month, count)
  values (p_user_id, p_month, 0)
  on conflict (user_id, month) do nothing;

  select count into current_count
  from public.scan_usage
  where user_id = p_user_id and month = p_month
  for update;

  if current_count >= p_limit then
    return false;
  end if;

  update public.scan_usage
  set count = count + 1
  where user_id = p_user_id and month = p_month;

  return true;
end;
$$;
