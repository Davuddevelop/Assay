-- Subscriptions — one row per user, the source of truth for which plan they're
-- on. Written only by the Stripe webhook (service role); read by the app to
-- gate scans, watching, and email alerts. A user with no row is Free.
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  plan                   text not null default 'free',   -- 'free' | 'pro' | 'team'
  status                 text not null default 'active',  -- 'active' | 'past_due' | 'canceled'
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

-- Owner can read their own subscription; all writes go through the service role
-- (the Stripe webhook), never the client.
drop policy if exists "subscriptions: owner can read" on public.subscriptions;
create policy "subscriptions: owner can read" on public.subscriptions
  for select using (user_id = auth.uid());
