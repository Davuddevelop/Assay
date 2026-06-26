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
    };
    Views: Record<string, never>;
    Functions: {
      consume_usage: {
        Args: { p_install_id: string; p_month: string; p_limit: number };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
