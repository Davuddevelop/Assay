/**
 * Firebase detection + response predicates. Pure (no I/O) so every judgement
 * about "is this database open?" is unit-tested independently of the network.
 *
 * Firebase is the other half of the AI-builder backend world — Bolt and Replit
 * apps reach for it as often as Lovable apps reach for Supabase. Its failure
 * mode is identical: the rules ship wide open (`".read": true`) and every
 * record is readable by anyone with the project id, which is in the bundle.
 */

export interface FirebaseRef {
  projectId: string;
  /** Realtime Database origin, when the app uses RTDB. */
  databaseUrl: string | null;
}

// Realtime Database lives on two host patterns: the original firebaseio.com and
// the regional firebasedatabase.app introduced with multi-region RTDB.
const RTDB_URL_RE =
  /https:\/\/[a-z0-9-]+\.firebaseio\.com|https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.firebasedatabase\.app/i;
const PROJECT_ID_RE = /projectId\s*[:=]\s*["']([a-z0-9][a-z0-9-]{3,})["']/i;
// Something that only a Firebase app ships. Guards the generic `projectId` key.
const FIREBASE_MARKER_RE =
  /firebaseapp\.com|firebaseio\.com|firebasedatabase\.app|firebasestorage|appspot\.com|firebase(?:Config|\/app|\/firestore|\/database)/i;
const AUTH_DOMAIN_RE = /["']([a-z0-9][a-z0-9-]{3,})\.firebaseapp\.com["']/i;
const STORAGE_BUCKET_RE = /["']([a-z0-9][a-z0-9-]{3,})\.(?:appspot\.com|firebasestorage\.app)["']/i;

/**
 * Find a Firebase project in client text. Requires a project id we can actually
 * address — an `AIza` key alone is not enough, since those are deliberately
 * public and appear in plenty of apps that use no Firebase database at all.
 * Pure — tested.
 */
export function detectFirebase(text: string): FirebaseRef | null {
  // `projectId` on its own is a generic config key (Google Cloud, Sentry, and
  // others use it), so it only counts alongside something unmistakably
  // Firebase. The domain-derived ids below are self-evidencing.
  const hasFirebaseMarker = FIREBASE_MARKER_RE.test(text);
  const projectId =
    (hasFirebaseMarker ? text.match(PROJECT_ID_RE)?.[1] : undefined) ??
    text.match(AUTH_DOMAIN_RE)?.[1] ??
    text.match(STORAGE_BUCKET_RE)?.[1] ??
    null;
  if (!projectId) return null;

  // Prefer the URL the app actually declares; otherwise assume the default
  // instance, which is what the Firebase console provisions.
  const databaseUrl =
    text.match(RTDB_URL_RE)?.[0] ?? `https://${projectId}-default-rtdb.firebaseio.com`;

  return { projectId, databaseUrl };
}

/**
 * Whether a shallow Realtime Database read came back with data — the signal
 * that `.read` is open to the world.
 *
 * We always query with `?shallow=true`, which returns ONLY the top-level key
 * names (`{"users": true}`) and never a single record value. That keeps the
 * "we never read your users' data" invariant true by construction rather than
 * by discipline. Pure.
 */
export function isOpenRealtimeDb(status: number, body: unknown): boolean {
  if (status !== 200 || body === null || body === undefined) return false;
  if (typeof body !== "object" || Array.isArray(body)) return false;
  return Object.keys(body as Record<string, unknown>).length > 0;
}

/** Top-level key names from a shallow RTDB read — schema only, never values. Pure. */
export function keysFromShallow(body: unknown): string[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  return Object.keys(body as Record<string, unknown>);
}

/**
 * Whether a Firestore collection read returned documents to an unauthenticated
 * caller — the signal that the security rules allow public reads. Pure.
 */
export function isOpenFirestore(status: number, body: unknown): boolean {
  if (status !== 200 || !body || typeof body !== "object") return false;
  const docs = (body as { documents?: unknown }).documents;
  return Array.isArray(docs) && docs.length > 0;
}

/**
 * Field NAMES on the first Firestore document — the schema of what's exposed,
 * never the values. Firestore wraps every field in a typed object
 * (`{stringValue: "..."}`), and we deliberately read only the keys. Pure.
 */
export function fieldsFromFirestoreDoc(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const docs = (body as { documents?: unknown }).documents;
  if (!Array.isArray(docs) || docs.length === 0) return [];
  const first = docs[0];
  if (!first || typeof first !== "object") return [];
  const fields = (first as { fields?: unknown }).fields;
  if (!fields || typeof fields !== "object") return [];
  return Object.keys(fields as Record<string, unknown>);
}
