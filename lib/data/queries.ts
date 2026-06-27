import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageSummary, type UsageSummary } from "@/lib/usage";
import { pickLatestByRepo } from "@/lib/data/derive";
import type { CheckRow, FindingRow, InstallationRow, RepoRow } from "@/lib/db/types";

/**
 * Read layer for the signed-in user. All reads go through the user-scoped
 * Supabase client, so Row-Level Security guarantees a user only ever sees data
 * for installations they own — no per-query ownership checks needed.
 */

export interface RepoWithStatus extends RepoRow {
  latestCheck: CheckRow | null;
}

export interface Workspace {
  installations: Pick<InstallationRow, "id" | "plan" | "account_login">[];
  repos: RepoWithStatus[];
  recentChecks: CheckRow[];
  usage: UsageSummary | null;
  plan: string;
}

export async function getWorkspace(): Promise<Workspace> {
  const db = await createClient();

  const { data: installs } = await db
    .from("installations")
    .select("id, plan, account_login");
  const installations = installs ?? [];

  const { data: repoRows } = await db.from("repos").select("*").order("full_name");
  const repos = repoRows ?? [];

  const repoIds = repos.map((r) => r.id);
  let checks: CheckRow[] = [];
  if (repoIds.length > 0) {
    const { data } = await db
      .from("checks")
      .select("*")
      .in("repo_id", repoIds)
      .order("created_at", { ascending: false });
    checks = data ?? [];
  }

  const latest = pickLatestByRepo(checks);
  const reposWithStatus: RepoWithStatus[] = repos.map((r) => ({
    ...r,
    latestCheck: latest[r.id] ?? null,
  }));

  // Plan + usage from the primary installation (first owned).
  const primary = installations[0] ?? null;
  const plan = primary?.plan ?? "free";
  const usage = primary ? await getUsageSummary(primary.id, plan) : null;

  return {
    installations,
    repos: reposWithStatus,
    recentChecks: checks.slice(0, 10),
    usage,
    plan,
  };
}

export async function getRepo(id: string): Promise<RepoRow | null> {
  const db = await createClient();
  const { data } = await db.from("repos").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getRepoChecks(repoId: string, limit = 20): Promise<CheckRow[]> {
  const db = await createClient();
  const { data } = await db
    .from("checks")
    .select("*")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface CheckDetail {
  check: CheckRow;
  repo: RepoRow | null;
  findings: FindingRow[];
}

export async function getCheckDetail(id: string): Promise<CheckDetail | null> {
  const db = await createClient();
  const { data: check } = await db.from("checks").select("*").eq("id", id).maybeSingle();
  if (!check) return null;

  const [{ data: repo }, { data: findings }] = await Promise.all([
    db.from("repos").select("*").eq("id", check.repo_id).maybeSingle(),
    db.from("findings").select("*").eq("check_id", id).order("severity"),
  ]);

  return { check, repo: repo ?? null, findings: findings ?? [] };
}

export async function getReposForRules(): Promise<RepoRow[]> {
  const db = await createClient();
  const { data } = await db.from("repos").select("*").order("full_name");
  return data ?? [];
}

/**
 * Update a repo's rules. Confirms the user can see the repo under RLS (i.e.
 * owns it), then writes with the service role. Returns false if not permitted.
 */
export async function updateRepoRules(repoId: string, rules: string): Promise<boolean> {
  const userDb = await createClient();
  const { data: visible } = await userDb
    .from("repos")
    .select("id")
    .eq("id", repoId)
    .maybeSingle();
  if (!visible) return false;

  const admin = createAdminClient();
  const { error } = await admin
    .from("repos")
    .update({ rules })
    .eq("id", repoId);
  return !error;
}
