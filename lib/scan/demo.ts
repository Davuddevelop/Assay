import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreFindings } from "@/lib/scan/score";
import type { ScanRow, ScanFindingRow, ScanFindingSeverity } from "@/lib/db/types";

const DEMO_URL = "https://my-saas.lovable.app";

interface SeedFinding {
  kind: string;
  severity: ScanFindingSeverity;
  title: string;
  plain_explanation: string;
  fix_prompt: string;
  manual_steps: string;
  redacted_location: string;
}

/** A realistic, complete sample report — the demo must always look finished. */
const DEMO_FINDINGS: SeedFinding[] = [
  {
    kind: "supabase-rls",
    severity: "critical",
    title: "Anyone on the internet can read your users' data",
    plain_explanation:
      "Your app's database isn't protected. Right now, anyone — not just your logged-in users — can read every row in your `users` and `orders` tables, including names, email addresses, and order history. This is the single most common and most serious mistake in vibe-coded apps.",
    fix_prompt:
      "Turn on Row Level Security for all my tables in Supabase. For each table (users, orders), enable RLS and add a policy so that a user can only read and edit their own rows (where the row's user_id equals auth.uid()). Do not allow public/anonymous read access to any table containing personal data.",
    manual_steps:
      "Open your Supabase dashboard → Authentication is fine, go to Table Editor.\nFor each table, click the table → … menu → Edit table → toggle on 'Enable Row Level Security'.\nThen Policies → New policy → 'Enable read for users based on user_id'.",
    redacted_location: "https://abcd1234.supabase.co — tables: users, orders",
  },
  {
    kind: "exposed-secret",
    severity: "critical",
    title: "Your Stripe secret key is visible to everyone",
    plain_explanation:
      "Your private Stripe key is sitting in the code that every visitor's browser downloads. With it, someone could issue refunds, read your payment data, or run charges. Secret keys must never be in the browser — only on a server.",
    fix_prompt:
      "Remove the hardcoded Stripe secret key (sk_live_…) from the frontend code. Move all Stripe calls that use the secret key into a secure server-side function (an edge function / serverless route), and read the key from an environment variable there. The browser should only ever use the publishable key (pk_…).",
    manual_steps:
      "Rotate the key immediately in your Stripe dashboard (Developers → API keys → roll the secret key).\nDelete the old key from your app's code.\nStore the new secret key as a server-side environment variable / secret, not in the frontend.",
    redacted_location: "bundle index-a8f3.js — sk_…7d (107 chars)",
  },
  {
    kind: "missing-header",
    severity: "minor",
    title: "Missing a basic protection against injected scripts",
    plain_explanation:
      "Your app doesn't send a Content-Security-Policy. It's a safety net that makes it much harder for an attacker to run malicious scripts on your site. Not urgent, but worth adding before you grow.",
    fix_prompt:
      "Add a Content-Security-Policy response header to my app that only allows scripts and styles from my own domain and the services I actually use. Start in report-only mode so it doesn't break anything, then enforce it.",
    manual_steps:
      "If your host supports custom headers, add a Content-Security-Policy header.\nStart with Content-Security-Policy-Report-Only to test safely.",
    redacted_location: "HTTP response headers",
  },
];

/** Ensure the demo scan + findings exist; return the report. Idempotent. */
export async function getDemoReport(): Promise<{ scan: ScanRow; findings: ScanFindingRow[] }> {
  const db = createAdminClient();

  const { data: existing } = await db
    .from("scans")
    .select("*")
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: findings } = await db
      .from("scan_findings")
      .select("*")
      .eq("scan_id", existing.id)
      .order("severity");
    return { scan: existing, findings: findings ?? [] };
  }

  const { score, verdict } = scoreFindings(DEMO_FINDINGS);
  const { data: scan, error } = await db
    .from("scans")
    .insert({
      app_url: DEMO_URL,
      platform: "lovable",
      status: "completed",
      score,
      verdict,
      is_demo: true,
      completed_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !scan) throw new Error(`seed demo: ${error?.message}`);

  const { data: findings } = await db
    .from("scan_findings")
    .insert(DEMO_FINDINGS.map((f) => ({ ...f, scan_id: scan.id })))
    .select("*");

  return { scan, findings: findings ?? [] };
}
