-- ─────────────────────────────────────────────────────────────────────────────
-- Persist what the scan could actually examine.
--
-- lib/scan/coverage.ts already computes this, and the live report already
-- shows it — but only in memory, on the streaming path. The moment a scan was
-- saved, that knowledge was dropped. So `/scan/[id]` and, worse, the public
-- badge had no idea whether a clean result meant "we checked everything and
-- found nothing" or "we could not see your database at all".
--
-- The mark is the whole product's credibility, and it was mintable from a scan
-- that never examined a backend. Two people found this independently in a
-- week: a corporate filter block that prompted a look at our own report, and a
-- developer whose full-stack app passed because Clerk and server-side storage
-- put nearly all of it out of reach. Both are the same bug.
--
-- Nullable with no default, deliberately. NULL means "this scan predates
-- coverage tracking", which is the truth for every existing row, and it is not
-- the same as false. Everything that gates on it treats NULL as "not
-- established" — an unknown must never read as a pass — so old marks show as
-- incomplete until the app is scanned again, which takes one re-check.
--
-- `coverage` rides along so a saved report can say *which* check could not run
-- and why. A report that says "not conclusive" without naming the gap is fear
-- without a fix (CLAUDE.md §4).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.scans
  add column if not exists conclusive boolean,
  add column if not exists coverage   jsonb;

comment on column public.scans.conclusive is
  'True only when every check ran against something real. NULL = scan predates coverage tracking. Gates the hallmark.';

comment on column public.scans.coverage is
  'CheckCoverage[] from lib/scan/coverage.ts — per-check status and plain-language detail.';
