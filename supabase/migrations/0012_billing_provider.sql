-- ─────────────────────────────────────────────────────────────────────────────
-- Make the subscription columns provider-neutral.
--
-- Billing moved from Stripe to Paddle: Stripe does not operate in the country
-- this is sold from, and Paddle acts as merchant of record, which also settles
-- the VAT question that comes with selling software internationally.
--
-- The columns held a Stripe customer/subscription id and now hold a Paddle
-- one (`ctm_…` / `sub_…`). Same meaning, different issuer, so they are renamed
-- rather than replaced — the rows are worth nothing today but the naming would
-- have been a lie the moment someone read it.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.subscriptions
  rename column stripe_customer_id to billing_customer_id;

alter table public.subscriptions
  rename column stripe_subscription_id to billing_subscription_id;

drop index if exists subscriptions_customer_idx;
create index if not exists subscriptions_customer_idx
  on public.subscriptions (billing_customer_id);
