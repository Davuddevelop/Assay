-- ─────────────────────────────────────────────────────────────────────────────
-- Continuous re-checking — watched apps.
--
-- A user flips "Watch this app" on a scan report; a daily job re-scans every
-- active watched app (metered against the user's plan) so a change that breaks
-- security shows up on the dashboard instead of in production. Writes go
-- through the service role; RLS gives owners read access.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.monitored_apps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  app_url    text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, app_url)
);

create index if not exists monitored_apps_active_idx
  on public.monitored_apps (active) where active;

alter table public.monitored_apps enable row level security;

create policy "monitored_apps: owner can read"
  on public.monitored_apps for select
  using (user_id = auth.uid());
