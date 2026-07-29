-- ─────────────────────────────────────────────────────────────────────────────
-- Agent memory — the conversation with a watched app's agent, persisted.
--
-- Until now the chat lived in React state: refresh the page and the agent had
-- forgotten you existed. That makes it a lookup box. Continuity is what turns
-- it into something that can say "you told me on the 3rd you'd lock that
-- bucket — it's still open", which no report can say and no fresh competitor
-- can have on day one.
--
-- Writes go through the service role (the route appends both sides of a turn
-- after it has authorised the user); RLS gives owners read access to their own
-- conversations and nobody else's.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.agent_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- Scoped to the watched app, not to a browser session: the same conversation
  -- continues across devices, and it disappears with the app it was about.
  monitor_id uuid not null references public.monitored_apps (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

-- The only read pattern: this app's conversation, oldest first.
create index if not exists agent_messages_monitor_idx
  on public.agent_messages (monitor_id, created_at);

alter table public.agent_messages enable row level security;

drop policy if exists "agent_messages: owner can read" on public.agent_messages;
create policy "agent_messages: owner can read"
  on public.agent_messages for select
  using (user_id = auth.uid());
