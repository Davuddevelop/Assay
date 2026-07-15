-- ─────────────────────────────────────────────────────────────────────────────
-- Change-detected monitoring.
--
-- Instead of blindly re-scanning every watched app on a timer, the monitor
-- fingerprints each app cheaply and only runs a full re-scan when the app
-- actually changed — the "you just shipped something" moment. These columns
-- store the last fingerprint and when we last looked.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.monitored_apps
  add column if not exists last_fingerprint text,
  add column if not exists last_checked_at  timestamptz;
