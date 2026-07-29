import "server-only";

import { timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import {
  looksLikeApiKey,
  hashApiKey,
  keyPrefix,
  generateApiKey,
  bearerFrom,
} from "@/lib/api-keys-core";

/**
 * API keys — the credential an agent outside the browser carries.
 *
 * Format and hashing live in `lib/api-keys-core.ts` so they stay testable; this
 * module is the half that touches the database.
 */
export { bearerFrom };

/**
 * Resolve a key to its owner, or null. Revoked keys never resolve.
 *
 * The hash lookup is exact, so the database does the matching; the constant-
 * time compare afterwards is belt-and-braces against a future refactor that
 * makes this a scan rather than an index hit.
 */
export async function userIdForApiKey(key: string): Promise<string | null> {
  if (!looksLikeApiKey(key)) return null;
  const hash = hashApiKey(key);
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("api_keys")
      .select("id, user_id, key_hash, revoked_at")
      .eq("key_hash", hash)
      .maybeSingle();
    if (!data || data.revoked_at) return null;

    const a = Buffer.from(data.key_hash);
    const b = Buffer.from(hash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    // Fire-and-forget: a "last used" timestamp is worth having for revoking a
    // stale key, and never worth failing an authenticated request over.
    void db
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then(() => undefined);

    return data.user_id;
  } catch (err) {
    log.warn("api key lookup failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

/** What the owner is shown about a key. Never includes the hash. */
export interface ApiKeySummary {
  id: string;
  prefix: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** A user's live keys, newest first. Revoked keys are gone from the list. */
export async function listApiKeys(userId: string): Promise<ApiKeySummary[]> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("api_keys")
      .select("id, prefix, label, created_at, last_used_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row) => ({
      id: row.id,
      prefix: row.prefix,
      label: row.label,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    }));
  } catch (err) {
    log.warn("api key list failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return [];
  }
}

/**
 * Revoke a key. Scoped to the owner, so an id guessed from elsewhere does
 * nothing. Kept as a row rather than deleted — a revoked key that reappears in
 * a log should still be attributable.
 */
export async function revokeApiKey(userId: string, id: string): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .is("revoked_at", null);
    return !error;
  } catch (err) {
    log.warn("api key revoke failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

/** Mint a key for a user. Returns the plaintext ONCE — it cannot be re-read. */
export async function createApiKey(
  userId: string,
  label: string,
): Promise<{ key: string } | null> {
  const key = generateApiKey();
  try {
    const db = createAdminClient();
    const { error } = await db.from("api_keys").insert({
      user_id: userId,
      prefix: keyPrefix(key),
      key_hash: hashApiKey(key),
      label: label.slice(0, 80) || "Untitled key",
    });
    if (error) {
      log.warn("api key create failed", { reason: error.message });
      return null;
    }
    return { key };
  } catch (err) {
    log.warn("api key create failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}
