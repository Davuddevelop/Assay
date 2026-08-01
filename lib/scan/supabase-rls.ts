import "server-only";

import type { RawFinding, ExposureProof } from "@/lib/scan/types";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { redactRow } from "@/lib/scan/redact";
import {
  detectSupabase,
  isSupabaseServiceKey,
  tablesFromOpenApi,
  isExposedResponse,
  columnsFromRow,
  sensitiveColumns,
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
const PROBE_TIMEOUT_MS = 5_000;
const MAX_TABLES = 6;
// Hard ceiling on the whole probe so a slow/large DB can never hang a scan.
const PROBE_BUDGET_MS = 10_000;
// Tried only when the DB won't list its tables — common vibe-coded table names.
const COMMON_TABLES = ["users", "profiles", "customers", "orders", "posts", "messages"];
// How many real rows to pull for the proof, and how many to actually show. We
// read a handful so the "N rows" count is real, and render at most PROOF_ROWS
// of them redacted — enough to be undeniable, never enough to be a dump.
const PROOF_FETCH_LIMIT = 5;
const PROOF_ROWS = 3;

/** A single request that NEVER throws — network/timeout errors become status 0. */
async function getJson(url: string, anonKey: string): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual", // a REST read has no reason to redirect; don't follow one
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

  // A service key bypasses RLS entirely, so probing with it would report every
  // table as "exposed" even when the policies are correct. Bail out. The leak
  // itself is already reported once by the secret scanner (`patterns.ts`) —
  // reporting it here too produced two cards and a double score penalty for a
  // single problem.
  if (isSupabaseServiceKey(ref.anonKey)) return findings;

  try {
    await assertScannableUrl(ref.url);
  } catch {
    return findings;
  }

  const exposed: string[] = [];
  // The first table we catch exposed becomes the evidence: its columns, and a
  // few of its rows redacted into proof. Raw values live only inside this try
  // block and never leave it un-redacted.
  let evidenceTable = "";
  let evidenceColumns: string[] = [];
  let evidenceProof: ExposureProof | undefined;
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
      // Pull a handful of rows, not one: the count in the proof ("47 rows")
      // needs the real number, and the extra rows are redacted the same way.
      const res = await getJson(
        `${ref.url}/rest/v1/${encodeURIComponent(table)}?select=*&limit=${PROOF_FETCH_LIMIT}`,
        ref.anonKey,
      );
      // Rows returned to an unauthenticated request → RLS is not protecting it.
      if (isExposedResponse(res.status, res.body)) {
        exposed.push(table);
        if (evidenceColumns.length === 0) {
          evidenceTable = table;
          evidenceColumns = columnsFromRow(res.body);
          evidenceProof = buildProof(table, res.body, evidenceColumns);
        }
      }
    }
  } catch {
    // A probe failure must never sink the scan — return whatever we confirmed.
    return findings;
  }

  if (exposed.length > 0) {
    const sensitive = sensitiveColumns(evidenceColumns);
    const shown = (sensitive.length ? sensitive : evidenceColumns).slice(0, 6);
    const columnLine = shown.length
      ? ` The exposed columns include ${shown.join(", ")}.`
      : "";
    findings.push({
      kind: "supabase-rls",
      severity: "critical",
      title: "Anyone can read your users' private data",
      detail: `Your database has no lock on it. ${exposed.length} table(s) (${exposed.join(", ")}) hand real records to anyone on the internet — no login, no password, no account needed.${columnLine} This is the single most common way vibe-coded apps leak their users' data.`,
      // Passed through verbatim to the report (never sent to the AI), so the
      // "here's what's exposed right now" proof always survives. Schema only.
      redactedLocation: shown.length ? `${evidenceTable}: ${shown.join(", ")}` : exposed.join(", "),
      proof: evidenceProof,
    });
  }

  return findings;
}

/**
 * Turn the raw rows the probe pulled into a redacted proof object. Every value
 * goes through lib/scan/redact; nothing raw leaves this function. Returns
 * undefined rather than an empty proof so the report can simply check presence.
 */
function buildProof(
  table: string,
  body: unknown,
  columns: string[],
): ExposureProof | undefined {
  if (!Array.isArray(body) || body.length === 0) return undefined;
  const preferred = sensitiveColumns(columns);
  const rows = body
    .slice(0, PROOF_ROWS)
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => redactRow(r, preferred));
  if (rows.length === 0) return undefined;
  return { table, rowCount: body.length, rows };
}
