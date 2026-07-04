import "server-only";

import type { RawFinding } from "@/lib/scan/types";
import { assertScannableUrl } from "@/lib/scan/fetch";
import {
  detectSupabase,
  decodeJwtRole,
  tablesFromOpenApi,
  isExposedResponse,
  type SupabaseRef,
} from "@/lib/scan/supabase-detect";

export { detectSupabase };
export type { SupabaseRef };

/**
 * The highest-value check: a Supabase app that ships its anon key (normal) but
 * left Row-Level Security OFF — so anyone can read/write every user's data.
 *
 * Strictly detection + a single bounded, READ-ONLY probe per table. We record
 * only WHETHER rows came back without auth — never the data itself, never a
 * write, never an exploit. The probe runs only on an app the user owns.
 */
const PROBE_TIMEOUT_MS = 6_000;
const MAX_TABLES = 6;
// Hard ceiling on the whole probe so a slow/large DB can never hang a scan.
const PROBE_BUDGET_MS = 18_000;
// Tried only when the DB won't list its tables — common vibe-coded table names.
const COMMON_TABLES = ["users", "profiles", "customers", "orders", "posts", "messages"];

/** A single request that NEVER throws — network/timeout errors become status 0. */
async function getJson(url: string, anonKey: string): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON */
    }
    return { status: res.status, body };
  } catch {
    return { status: 0, body: null }; // unreachable / aborted — treat as "not exposed"
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe whether tables are readable unauthenticated (RLS off). Returns findings.
 * `ref.url` must already be confirmed scannable by the caller; we re-guard it.
 */
export async function probeSupabaseRls(ref: SupabaseRef): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  // Exposed service key is game-over on its own.
  if (decodeJwtRole(ref.anonKey) === "service_role") {
    findings.push({
      kind: "supabase-rls",
      severity: "critical",
      title: "Supabase service key exposed in the browser",
      detail:
        "The service_role key is in client code. It bypasses ALL security rules — anyone can read, change, or delete any data.",
      redactedLocation: `${ref.url} (service_role key)`,
    });
    return findings; // no need to probe; this is already critical
  }

  try {
    await assertScannableUrl(ref.url);
  } catch {
    return findings;
  }

  const exposed: string[] = [];
  try {
    const deadline = Date.now() + PROBE_BUDGET_MS;

    // List tables from the PostgREST OpenAPI root. If introspection is disabled
    // (empty spec), fall back to a few common names — still zero false positives,
    // since we only flag a table that ACTUALLY returns rows without auth.
    const root = await getJson(`${ref.url}/rest/v1/`, ref.anonKey);
    let tables = tablesFromOpenApi(root.body).slice(0, MAX_TABLES);
    if (tables.length === 0) tables = COMMON_TABLES;

    for (const table of tables) {
      if (Date.now() > deadline) break; // out of budget — report what we found
      const res = await getJson(
        `${ref.url}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`,
        ref.anonKey,
      );
      // Rows returned to an unauthenticated request → RLS is not protecting it.
      // We use ONLY the array length; the data itself is discarded.
      if (isExposedResponse(res.status, res.body)) exposed.push(table);
    }
  } catch {
    // A probe failure must never sink the scan — return whatever we confirmed.
    return findings;
  }

  if (exposed.length > 0) {
    findings.push({
      kind: "supabase-rls",
      severity: "critical",
      title: "Your database is readable by anyone",
      detail: `Row-Level Security is off or misconfigured: ${exposed.length} table(s) returned data to an unauthenticated request (${exposed.join(", ")}). Anyone on the internet can read this data.`,
      redactedLocation: `${ref.url} — tables: ${exposed.join(", ")}`,
    });
  }

  return findings;
}
