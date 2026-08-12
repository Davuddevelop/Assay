/**
 * Hand-maintained mirror of the Postgres schema in
 * `supabase/migrations/0001_init.sql`. Kept in sync by hand for now; once a
 * Supabase project exists this can be replaced by `supabase gen types`.
 *
 * Shaped for `@supabase/supabase-js` generics:
 *   Database['public']['Tables'][T]['Row' | 'Insert' | 'Update']
 */
import type { CheckCoverage } from "@/lib/scan/coverage";

type CheckStatus = "queued" | "running" | "completed" | "error";
type Verdict = "assayed" | "held";
type FindingType = "rule" | "security" | "test" | "quality";
type FindingSeverity = "low" | "medium" | "high" | "critical";

type InstallationRow = {
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

type RepoRow = {
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

type FindingRow = {
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

type EmbeddingRow = {
  id: string;
  repo_id: string;
  path: string;
  chunk: string;
  vector: string | null;
  created_at: string;
}

type UsageRow = {
  id: string;
  install_id: string;
  month: string;
  count: number;
}

// ── Pivot: app security scans ────────────────────────────────────────────────
type ScanStatus = "queued" | "running" | "completed" | "error";
// Type-only import — erased at compile time, so it introduces no runtime
// dependency or import cycle between the schema mirror and the scanner types.
import type { ExposureProof } from "@/lib/scan/types";
export type { ExposureProof };

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
  /**
   * Whether every check ran against something real. NULL means the scan
   * predates coverage tracking — not the same as false, and never a pass.
   * The hallmark gates on this.
   */
  conclusive: boolean | null;
  /** Per-check status and plain-language detail. NULL on legacy rows. */
  coverage: CheckCoverage[] | null;
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
  /**
   * Redacted proof this was reachable live. In-memory only — it is never
   * written to or read from the database, so a saved scan won't carry it. It
   * exists to make the anonymous /try report undeniable at the moment it lands.
   */
  proof?: ExposureProof;
};

type OwnershipProofRow = {
  id: string;
  user_id: string;
  app_url: string;
  method: string;
  token: string;
  verified_at: string | null;
  created_at: string;
};

type BadgeRow = {
  id: string;
  scan_id: string;
  public_token: string;
  created_at: string;
};

type ScanUsageRow = {
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
  last_fingerprint: string | null;
  last_checked_at: string | null;
  created_at: string;
};

/** A step between "ran a scan" and "has an account". Counts only, never who. */
type FunnelEventRow = {
  id: number;
  event: string;
  created_at: string;
};

/** Anonymous scan telemetry — shape of a result, never who ran it. */
type ScanStatRow = {
  id: number;
  platform: string;
  /** 'started' until the scan resolves; a row left at 'started' is a timeout. */
  outcome: string;
  /** A fixed bucket, never a message — see ScanFailureReason. */
  failure_reason: string | null;
  /** Null until the scan finishes, and forever if it never does. */
  verdict: string | null;
  score: number | null;
  critical: number;
  risky: number;
  minor: number;
  created_at: string;
  resolved_at: string | null;
};

type ApiKeyRow = {
  id: string;
  user_id: string;
  prefix: string;
  key_hash: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type AgentMessageRow = {
  id: string;
  user_id: string;
  monitor_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type EmailLogRow = {
  id: string;
  user_id: string;
  scan_id: string | null;
  kind: string;
  app_url: string | null;
  sent_at: string;
};

type LegalAcceptanceRow = {
  id: number;
  user_id: string;
  /** The LEGAL_VERSION constant at the moment they accepted. */
  version: string;
  /** 'signup' | 'reaccept' — see 0016_legal_acceptance.sql. */
  context: string;
  accepted_at: string;
};

type UserProfileRow = {
  user_id: string;
  /** 'lovable' | 'bolt' | 'replit' | 'v0' | 'other' — see lib/onboarding.ts. */
  platform: string | null;
  /** 'self' | 'client' | 'company'. */
  audience: string | null;
  skipped: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  user_id: string;
  plan: string;
  status: string;
  billing_customer_id: string | null;
  billing_subscription_id: string | null;
  current_period_end: string | null;
  updated_at: string;
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
      badges: Table<BadgeRow, "scan_id" | "public_token">;
      scan_usage: Table<ScanUsageRow, "user_id" | "month">;
      monitored_apps: Table<MonitoredAppRow, "user_id" | "app_url">;
      api_keys: Table<ApiKeyRow, "user_id" | "prefix" | "key_hash">;
      agent_messages: Table<AgentMessageRow, "user_id" | "monitor_id" | "role" | "content">;
      email_log: Table<EmailLogRow, "user_id" | "kind">;
      subscriptions: Table<SubscriptionRow, "user_id">;
      // verdict/score are no longer required on insert: a row is opened when a
      // scan starts, long before either is known.
      scan_stats: Table<ScanStatRow, "platform">;
      funnel_events: Table<FunnelEventRow, "event">;
      legal_acceptances: Table<LegalAcceptanceRow, "user_id" | "version">;
      user_profile: Table<UserProfileRow, "user_id">;
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
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
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
