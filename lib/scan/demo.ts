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
    title: "Anyone can read your users' private data",
    plain_explanation:
      "Your database has no lock on it. Right now, anyone — not just your logged-in users — can read every row in your `users` and `orders` tables, with no login and no password. This is the single most common and most serious mistake in vibe-coded apps.",
    fix_prompt:
      "Turn on Row Level Security for all my tables in Supabase. For each table (users, orders), enable RLS and add a policy so that a user can only read and edit their own rows (where the row's user_id equals auth.uid()). Do not allow public/anonymous read access to any table containing personal data.",
    manual_steps:
      "Open your Supabase dashboard → Authentication is fine, go to Table Editor.\nFor each table, click the table → … menu → Edit table → toggle on 'Enable Row Level Security'.\nThen Policies → New policy → 'Enable read for users based on user_id'.",
    redacted_location: "users: email, full_name, phone, stripe_customer_id",
  },
  {
    kind: "supabase-storage",
    severity: "risky",
    title: "Anyone can open your users' uploaded files",
    plain_explanation:
      "Your file storage is open. Anyone on the internet can list and download everything users have uploaded — profile photos, and anything else stored in these buckets — without logging in.",
    fix_prompt:
      "In Supabase Storage, make my 'avatars' and 'documents' buckets private (turn off the public flag) and add access policies so that a file can only be read by the user who owns it. Keep only genuinely public assets in a separate public bucket.",
    manual_steps:
      "Open Supabase → Storage → each bucket → Settings → turn off 'Public bucket'.\nAdd a storage policy so users can only read their own files.",
    redacted_location: "avatars (48+ files), documents (12+ files)",
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

/**
 * The sample report — built entirely from the seed data above, no database.
 * The content is static, so there's nothing to store or fetch; this makes
 * `/sample` work everywhere (even before Supabase is configured).
 */
export function getDemoReport(): { scan: ScanRow; findings: ScanFindingRow[] } {
  const now = new Date().toISOString();
  const { score, verdict } = scoreFindings(DEMO_FINDINGS);

  const scan: ScanRow = {
    id: "demo",
    user_id: null,
    app_url: DEMO_URL,
    platform: "lovable",
    status: "completed",
    score,
    verdict,
    is_demo: true,
    error: null,
    created_at: now,
    completed_at: now,
  };

  const findings: ScanFindingRow[] = DEMO_FINDINGS.map((f, i) => ({
    id: String(i),
    scan_id: "demo",
    created_at: now,
    ...f,
  }));

  return { scan, findings };
}
