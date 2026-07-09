-- ─────────────────────────────────────────────────────────────────────────────
-- Assay — initial schema.
--
-- The full data model is created up front (including tables not used until
-- later phases) so nothing has to be reworked. Row-Level Security is enabled on
-- every user-facing table: a signed-in user sees only rows for installations
-- they own. Background jobs use the service role, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- Vector similarity for Phase 5 repo embeddings (unused until then).
create extension if not exists vector;

-- ── installations ────────────────────────────────────────────────────────────
-- One row per GitHub App installation (an account that installed Assay).
create table if not exists public.installations (
  id                 uuid primary key default gen_random_uuid(),
  account_login      text not null,
  account_id         bigint not null,
  github_install_id  bigint not null unique,
  -- AES-256-GCM ciphertext (see lib/crypto.ts). Never store a plaintext token.
  encrypted_token    text,
  token_expires_at   timestamptz,
  -- The Supabase auth user who owns this installation. Null until a user signs
  -- in and claims it; RLS keeps unclaimed rows invisible to everyone but jobs.
  owner_user_id      uuid references auth.users (id) on delete set null,
  plan               text not null default 'free',
  created_at         timestamptz not null default now()
);

create index if not exists installations_owner_idx
  on public.installations (owner_user_id);

-- ── repos ────────────────────────────────────────────────────────────────────
create table if not exists public.repos (
  id              uuid primary key default gen_random_uuid(),
  install_id      uuid not null references public.installations (id) on delete cascade,
  github_repo_id  bigint not null unique,
  name            text not null,
  full_name       text not null,
  default_branch  text not null default 'main',
  -- Plain-language rules the user wrote; the review checks changes against these.
  rules           text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists repos_install_idx on public.repos (install_id);

-- ── checks ───────────────────────────────────────────────────────────────────
create table if not exists public.checks (
  id           uuid primary key default gen_random_uuid(),
  repo_id      uuid not null references public.repos (id) on delete cascade,
  commit_sha   text not null,
  pr_number    integer,
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'completed', 'error')),
  verdict      text check (verdict in ('assayed', 'held')),
  summary      text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  -- One check per repo + commit; webhook retries upsert rather than duplicate.
  unique (repo_id, commit_sha)
);

create index if not exists checks_repo_idx on public.checks (repo_id);

-- ── findings ─────────────────────────────────────────────────────────────────
create table if not exists public.findings (
  id         uuid primary key default gen_random_uuid(),
  check_id   uuid not null references public.checks (id) on delete cascade,
  type       text not null check (type in ('rule', 'security', 'test', 'quality')),
  severity   text not null check (severity in ('low', 'medium', 'high', 'critical')),
  message    text not null,
  file       text,
  line       integer,
  suggestion text,
  created_at timestamptz not null default now()
);

create index if not exists findings_check_idx on public.findings (check_id);

-- ── embeddings (Phase 5; created now, unused until then) ──────────────────────
create table if not exists public.embeddings (
  id         uuid primary key default gen_random_uuid(),
  repo_id    uuid not null references public.repos (id) on delete cascade,
  path       text not null,
  chunk      text not null,
  vector     vector(1024),
  created_at timestamptz not null default now()
);

create index if not exists embeddings_repo_idx on public.embeddings (repo_id);

-- ── usage (the meter) ─────────────────────────────────────────────────────────
-- One row per installation per month; the check count is enforced against the
-- plan's monthly limit before a check runs.
create table if not exists public.usage (
  id         uuid primary key default gen_random_uuid(),
  install_id uuid not null references public.installations (id) on delete cascade,
  month      text not null, -- 'YYYY-MM'
  count      integer not null default 0,
  unique (install_id, month)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
--
-- Enable on every user-facing table. With no permissive policy for the `anon`
-- / `authenticated` roles other than the ones below, the anon key can only read
-- rows reachable from an installation the user owns. The service role used by
-- jobs bypasses RLS entirely, so no write policies are needed for them.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.installations enable row level security;
alter table public.repos         enable row level security;
alter table public.checks        enable row level security;
alter table public.findings      enable row level security;
alter table public.embeddings    enable row level security;
alter table public.usage         enable row level security;

-- installations: the owner can read their own rows.
drop policy if exists "installations: owner can read" on public.installations;
create policy "installations: owner can read"
  on public.installations for select
  using (owner_user_id = auth.uid());

-- repos: readable if the parent installation is owned by the user.
drop policy if exists "repos: owner can read" on public.repos;
create policy "repos: owner can read"
  on public.repos for select
  using (
    exists (
      select 1 from public.installations i
      where i.id = repos.install_id
        and i.owner_user_id = auth.uid()
    )
  );

-- checks: readable if the repo's installation is owned by the user.
drop policy if exists "checks: owner can read" on public.checks;
create policy "checks: owner can read"
  on public.checks for select
  using (
    exists (
      select 1
      from public.repos r
      join public.installations i on i.id = r.install_id
      where r.id = checks.repo_id
        and i.owner_user_id = auth.uid()
    )
  );

-- findings: readable if the parent check is visible to the user.
drop policy if exists "findings: owner can read" on public.findings;
create policy "findings: owner can read"
  on public.findings for select
  using (
    exists (
      select 1
      from public.checks c
      join public.repos r on r.id = c.repo_id
      join public.installations i on i.id = r.install_id
      where c.id = findings.check_id
        and i.owner_user_id = auth.uid()
    )
  );

-- embeddings: owner-scoped read (no client need yet, but locked down by default).
drop policy if exists "embeddings: owner can read" on public.embeddings;
create policy "embeddings: owner can read"
  on public.embeddings for select
  using (
    exists (
      select 1
      from public.repos r
      join public.installations i on i.id = r.install_id
      where r.id = embeddings.repo_id
        and i.owner_user_id = auth.uid()
    )
  );

-- usage: the owner can read their own meter.
drop policy if exists "usage: owner can read" on public.usage;
create policy "usage: owner can read"
  on public.usage for select
  using (
    exists (
      select 1 from public.installations i
      where i.id = usage.install_id
        and i.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Usage meter: atomically consume one check against the monthly limit.
--
-- Returns true and records the check if the installation is under its limit,
-- false (without incrementing) if it would exceed it. The `for update` lock
-- makes concurrent checks safe. SECURITY DEFINER so the service role calls it
-- as the function owner; callers are trusted jobs only.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.consume_usage(
  p_install_id uuid,
  p_month text,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.usage (install_id, month, count)
  values (p_install_id, p_month, 0)
  on conflict (install_id, month) do nothing;

  select count into current_count
  from public.usage
  where install_id = p_install_id and month = p_month
  for update;

  if current_count >= p_limit then
    return false;
  end if;

  update public.usage
  set count = count + 1
  where install_id = p_install_id and month = p_month;

  return true;
end;
$$;
