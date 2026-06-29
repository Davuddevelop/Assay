-- ─────────────────────────────────────────────────────────────────────────────
-- Assay pivot — app security scans.
--
-- A user submits the URL of an app THEY OWN; we scan it for vibe-coding security
-- failures and store plain-language findings + paste-back fix prompts. Ethics is
-- enforced in app code (ownership verification, SSRF guard, redaction); RLS keeps
-- each user's scans private. Public badge reports are served via the service role
-- by token, so no public RLS policy is needed.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.scans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete cascade,
  app_url      text not null,
  platform     text not null default 'unknown',
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'completed', 'error')),
  score        integer,
  verdict      text check (verdict in ('certified', 'at_risk')),
  is_demo      boolean not null default false,
  error        text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists scans_user_idx on public.scans (user_id, created_at desc);

create table if not exists public.scan_findings (
  id                uuid primary key default gen_random_uuid(),
  scan_id           uuid not null references public.scans (id) on delete cascade,
  kind              text not null,
  severity          text not null check (severity in ('critical', 'risky', 'minor')),
  title             text not null,
  plain_explanation text not null default '',
  fix_prompt        text not null default '',
  manual_steps      text not null default '',
  redacted_location text,
  created_at        timestamptz not null default now()
);

create index if not exists scan_findings_scan_idx on public.scan_findings (scan_id);

create table if not exists public.ownership_proofs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  app_url     text not null,
  method      text not null default 'meta-tag',
  token       text not null,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists ownership_user_idx on public.ownership_proofs (user_id);

create table if not exists public.badges (
  id           uuid primary key default gen_random_uuid(),
  scan_id      uuid not null references public.scans (id) on delete cascade,
  public_token text not null unique,
  created_at   timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.scans            enable row level security;
alter table public.scan_findings    enable row level security;
alter table public.ownership_proofs enable row level security;
alter table public.badges           enable row level security;

-- scans: the owner reads their own.
create policy "scans: owner can read"
  on public.scans for select
  using (user_id = auth.uid());

-- scan_findings: readable when the parent scan is owned by the user.
create policy "scan_findings: owner can read"
  on public.scan_findings for select
  using (
    exists (
      select 1 from public.scans s
      where s.id = scan_findings.scan_id
        and s.user_id = auth.uid()
    )
  );

-- ownership_proofs: owner only.
create policy "ownership_proofs: owner can read"
  on public.ownership_proofs for select
  using (user_id = auth.uid());

-- badges: no public policy; the public report route reads by token via the
-- service role. RLS stays enabled (locked) by default.
