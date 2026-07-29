import "server-only";

import type { RawFinding } from "@/lib/scan/types";
import { assertScannableUrl } from "@/lib/scan/fetch";
import {
  detectFirebase,
  isOpenRealtimeDb,
  keysFromShallow,
  isOpenFirestore,
  fieldsFromFirestoreDoc,
  type FirebaseRef,
} from "@/lib/scan/firebase-detect";
import { sensitiveColumns } from "@/lib/scan/supabase-detect";

export { detectFirebase };
export type { FirebaseRef };

/**
 * The Firebase counterpart to the Supabase RLS check: an app that ships its
 * (public, harmless) config but left its security rules open, so anyone can
 * read every record.
 *
 * Same discipline as every other probe here — detection only, read-only,
 * bounded, and schema-only. The Realtime Database read is always `shallow`, so
 * the API returns key names and physically cannot return a record. Firestore
 * returns documents, so we read only the FIELD NAMES off the first one and
 * discard the rest.
 */
const PROBE_TIMEOUT_MS = 5_000;
const PROBE_BUDGET_MS = 10_000;

// Firestore has no cheap "list my collections" call for an anonymous caller, so
// we try the names vibe-coded apps actually generate. A miss costs one bounded
// request and can never produce a false positive: we only ever flag a
// collection that really did hand documents to an unauthenticated request.
const COMMON_COLLECTIONS = ["users", "profiles", "posts", "messages", "orders", "customers"];
const MAX_COLLECTIONS = 4;

/** A single request that NEVER throws — network/timeout errors become status 0. */
async function getJson(url: string): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual" });
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

/** Probe whether Firebase data is readable without auth. Never throws. */
export async function probeFirebase(ref: FirebaseRef): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];
  const deadline = Date.now() + PROBE_BUDGET_MS;

  // ── Realtime Database ────────────────────────────────────────────────────
  if (ref.databaseUrl) {
    try {
      await assertScannableUrl(ref.databaseUrl);
      // `shallow=true` returns top-level key names only — never a record.
      const res = await getJson(`${ref.databaseUrl}/.json?shallow=true`);
      if (isOpenRealtimeDb(res.status, res.body)) {
        const keys = keysFromShallow(res.body).slice(0, 6);
        findings.push({
          kind: "firebase-rules",
          severity: "critical",
          title: "Anyone can read your whole database",
          detail: `Your Firebase Realtime Database is open to the internet. Any person who opens your app can download everything in it — no login, no password, no account needed.${
            keys.length ? ` The exposed sections include ${keys.join(", ")}.` : ""
          } This happens when the database rules are left set to public, which is the default while you're building.`,
          redactedLocation: keys.length
            ? `${ref.databaseUrl} — ${keys.join(", ")}`
            : ref.databaseUrl,
        });
      }
    } catch {
      /* unreachable or not scannable — nothing confirmed, report nothing */
    }
  }

  // ── Firestore ────────────────────────────────────────────────────────────
  try {
    const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      ref.projectId,
    )}/databases/(default)/documents`;
    const exposed: string[] = [];
    let evidenceCollection = "";
    let evidenceFields: string[] = [];

    for (const collection of COMMON_COLLECTIONS.slice(0, MAX_COLLECTIONS)) {
      if (Date.now() > deadline) break; // out of budget — report what we confirmed
      const res = await getJson(`${base}/${encodeURIComponent(collection)}?pageSize=1`);
      if (isOpenFirestore(res.status, res.body)) {
        exposed.push(collection);
        if (evidenceFields.length === 0) {
          evidenceCollection = collection;
          evidenceFields = fieldsFromFirestoreDoc(res.body);
        }
      }
    }

    if (exposed.length > 0) {
      const sensitive = sensitiveColumns(evidenceFields);
      const shown = (sensitive.length ? sensitive : evidenceFields).slice(0, 6);
      findings.push({
        kind: "firebase-rules",
        severity: "critical",
        title: "Anyone can read your users' private data",
        detail: `Your Firestore database has no lock on it. ${exposed.length} collection(s) (${exposed.join(
          ", ",
        )}) hand real records to anyone on the internet — no login required.${
          shown.length ? ` The exposed fields include ${shown.join(", ")}.` : ""
        } Your security rules need to require a signed-in user.`,
        // Never sent to the AI — this proof survives even if the explain step
        // fails. Field names only; no value ever leaves the probe.
        redactedLocation: shown.length
          ? `${evidenceCollection}: ${shown.join(", ")}`
          : exposed.join(", "),
      });
    }
  } catch {
    /* a probe failure must never sink the scan */
  }

  return findings;
}
