/**
 * Hand-maintained mirror of the Postgres schema in
 * `supabase/migrations/0001_init.sql`. Kept in sync by hand for now; once a
 * Supabase project exists this can be replaced by `supabase gen types`.
 *
 * Shaped for `@supabase/supabase-js` generics:
 *   Database['public']['Tables'][T]['Row' | 'Insert' | 'Update']
 */

export type CheckStatus = "queued" | "running" | "completed" | "error";
export type Verdict = "assayed" | "held";
export type FindingType = "rule" | "security" | "test" | "quality";
export type FindingSeverity = "low" | "medium" | "high" | "critical";

export type InstallationRow = {
  id: string;
  account_login: string;
  account_id: number;
  github_install_id: number;
  encrypted_token: string | null;
  token_expires_at: string | null;
  owner_user_id: string | null;
  plan: string;
  created_at: string;
}

export type RepoRow = {
  id: string;
  install_id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  default_branch: string;
  rules: string;
  created_at: string;
}

export type CheckRow = {
  id: string;
  repo_id: string;
  commit_sha: string;
  pr_number: number | null;
  status: CheckStatus;
  verdict: Verdict | null;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
}

export type FindingRow = {
  id: string;
  check_id: string;
  type: FindingType;
  severity: FindingSeverity;
  message: string;
  file: string | null;
  line: number | null;
  suggestion: string | null;
  created_at: string;
}

export type EmbeddingRow = {
  id: string;
  repo_id: string;
  path: string;
  chunk: string;
  vector: string | null;
  created_at: string;
}

export type UsageRow = {
  id: string;
  install_id: string;
  month: string;
  count: number;
}

// ── Pivot: app security scans ────────────────────────────────────────────────
export type ScanStatus = "queued" | "running" | "completed" | "error";
export type ScanVerdict = "certified" | "at_risk";
export type ScanFindingSeverity = "critical" | "risky" | "minor";

export type ScanRow = {
  id: string;
  user_id: string | null;
  app_url: string;
  platform: string;
  status: ScanStatus;
  score: number | null;
  verdict: ScanVerdict | null;
  is_demo: boolean;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ScanFindingRow = {
  id: string;
  scan_id: string;
  kind: string;
  severity: ScanFindingSeverity;
  title: string;
  plain_explanation: string;
  fix_prompt: string;
  manual_steps: string;
  redacted_location: string | null;
  created_at: string;
};

export type OwnershipProofRow = {
  id: string;
  user_id: string;
  app_url: string;
  method: string;
  token: string;
  verified_at: string | null;
  created_at: string;
};

export type ScanUsageRow = {
  id: string;
  user_id: string;
  month: string;
  count: number;
  created_at: string;
};

export type MonitoredAppRow = {
  id: string;
  user_id: string;
  app_url: string;
  active: boolean;
  created_at: string;
};

/**
 * An Insert type: the columns in `Req` are required, everything else (defaults
 * and nullables) is optional. Update is always a partial. Relationships is an
 * empty list — we don't type embedded-relationship selects.
 */
type Insertable<Row, Req extends keyof Row> = Pick<Row, Req> &
  Partial<Omit<Row, Req>>;

type Table<Row, Req extends keyof Row> = {
  Row: Row;
  Insert: Insertable<Row, Req>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      installations: Table<
        InstallationRow,
        "account_login" | "account_id" | "github_install_id"
      >;
      repos: Table<
        RepoRow,
        "install_id" | "github_repo_id" | "name" | "full_name"
      >;
      checks: Table<CheckRow, "repo_id" | "commit_sha">;
      findings: Table<
        FindingRow,
        "check_id" | "type" | "severity" | "message"
      >;
      embeddings: Table<EmbeddingRow, "repo_id" | "path" | "chunk">;
      usage: Table<UsageRow, "install_id" | "month">;
      scans: Table<ScanRow, "app_url">;
      scan_findings: Table<ScanFindingRow, "scan_id" | "kind" | "severity" | "title">;
      ownership_proofs: Table<OwnershipProofRow, "user_id" | "app_url" | "token">;
      scan_usage: Table<ScanUsageRow, "user_id" | "month">;
      monitored_apps: Table<MonitoredAppRow, "user_id" | "app_url">;
    };
    Views: Record<string, never>;
    Functions: {
      consume_usage: {
        Args: { p_install_id: string; p_month: string; p_limit: number };
        Returns: boolean;
      };
      consume_scan_usage: {
        Args: { p_user_id: string; p_month: string; p_limit: number };
        Returns: boolean;
      };
      match_embeddings: {
        Args: {
          p_repo_id: string;
          query_embedding: number[];
          match_count?: number;
        };
        Returns: { path: string; chunk: string; similarity: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
