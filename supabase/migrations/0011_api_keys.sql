-- ─────────────────────────────────────────────────────────────────────────────
-- API keys — how an agent outside the browser proves who it is.
--
-- The scan is most useful BEFORE an app ships, inside the tool the person is
-- already building in. Those clients (an editor, a coding agent, an MCP host)
-- have no session cookie, so they carry a key instead.
--
-- Only the SHA-256 of the key is stored: a database leak yields hashes, not
-- working credentials, and the plaintext exists exactly once — in the response
-- that created it. `prefix` is the first few characters, kept so a person can
-- tell their keys apart in a list without us being able to reconstruct one.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  -- Display only — never enough to authenticate with.
  prefix       text not null,
  key_hash     text not null unique,
  label        text not null default 'Untitled key',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

-- The auth path: hash lookup on every request.
create index if not exists api_keys_hash_idx on public.api_keys (key_hash);
create index if not exists api_keys_user_idx on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

-- Owners can see their own keys' metadata. The hash is not a secret worth
-- hiding from its owner, but it is never rendered — the UI shows `prefix`.
drop policy if exists "api_keys: owner can read" on public.api_keys;
create policy "api_keys: owner can read"
  on public.api_keys for select
  using (user_id = auth.uid());
