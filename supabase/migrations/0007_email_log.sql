-- Email log — a record of every transactional email Assay sends a user.
-- Serves three jobs at once:
--   1. Dedupe: the unique (scan_id, kind) index guarantees we never send more
--      than one regression alert for the same completed scan, even if the
--      background job replays.
--   2. Timeline: powers the per-app activity feed ("we emailed you on Jan 12").
--   3. Audit: a truthful trail of what we sent, owner-readable.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid references public.scans (id) on delete set null,
  kind text not null, -- 'regression' | 'digest'
  app_url text,
  sent_at timestamptz not null default now()
);

create index if not exists email_log_user_idx
  on public.email_log (user_id, sent_at desc);

-- One regression email per scan (dedupe backstop for job replays).
create unique index if not exists email_log_scan_kind_idx
  on public.email_log (scan_id, kind)
  where scan_id is not null;

alter table public.email_log enable row level security;

-- Owner can read their own email history; writes are service-role only.
drop policy if exists "email_log owner read" on public.email_log;
create policy "email_log owner read" on public.email_log
  for select using (user_id = auth.uid());
