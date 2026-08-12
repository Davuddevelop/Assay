-- ─────────────────────────────────────────────────────────────────────────────
-- Take the internal RPCs off the public API.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and Supabase
-- exposes every function in the `public` schema over PostgREST. Between those
-- two facts, four functions that only ever run from server code were callable
-- by anyone holding the anon key — which is a public value, printed in the
-- browser bundle by design.
--
-- Found by Supabase's own database linter, pointed at this project. Assay
-- scans other people's apps for precisely this shape of mistake.
--
-- What each one exposed:
--
--   match_embeddings   — the bad one. SECURITY DEFINER, so it runs as the
--                        owner and ignores RLS on public.embeddings, and it
--                        returns `path` and `chunk`: file paths and source
--                        text. Scoped only by a caller-supplied p_repo_id, so
--                        anyone who could name a repo id could read code out
--                        of it. Dead feature (no caller anywhere in the app,
--                        left over from the repo-review direction), live RPC.
--
--   consume_scan_usage — metering. A stranger could burn a paying user's
--                        monthly scan allowance by calling it with their user
--                        id. Not a bypass (the counter only goes up) but a
--                        clean denial of service against a customer.
--
--   consume_rate_limit — the rate limiter itself. Callable with an arbitrary
--                        key, so someone could exhaust another visitor's
--                        budget, or inflate the rate_limits table at will.
--                        CLAUDE.md §5 requires rate limiting on the anonymous
--                        surface; a limiter that outsiders can drive is not
--                        one.
--
--   consume_usage      — same shape as consume_scan_usage, for the dormant
--                        installations path. No caller either.
--
-- Safe to revoke: every live caller goes through createAdminClient(), i.e. the
-- service role, which is unaffected by these grants (lib/usage.ts,
-- lib/rate-limit-global.ts). Verified before writing this — revoking a grant
-- the app actually relied on would have silently disabled metering and rate
-- limiting in production, which is a worse outcome than the finding.
--
-- REVOKE ... FROM PUBLIC is the part that matters. Revoking from anon and
-- authenticated alone leaves the default PUBLIC grant in place, and both roles
-- inherit it — the lint would still fire and the function would still be
-- reachable.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)',
    'public.consume_scan_usage(p_user_id uuid, p_month text, p_limit integer)',
    'public.consume_usage(p_install_id uuid, p_month text, p_limit integer)',
    'public.match_embeddings(p_repo_id uuid, query_embedding public.vector, match_count integer)'
  ]
  loop
    -- to_regprocedure returns null rather than throwing when the function
    -- isn't there, so this migration stays runnable against a database where
    -- the dormant ones were already dropped.
    if to_regprocedure(fn) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end
$$;
