import { describe, it, expect } from "vitest";

import {
  detectFirebase,
  isOpenRealtimeDb,
  keysFromShallow,
  isOpenFirestore,
  fieldsFromFirestoreDoc,
} from "@/lib/scan/firebase-detect";

describe("detectFirebase", () => {
  it("reads the project id straight out of a firebase config", () => {
    const bundle = `const firebaseConfig={apiKey:"AIzaSyD-abc123",authDomain:"my-app.firebaseapp.com",projectId:"my-app",storageBucket:"my-app.appspot.com"}`;
    expect(detectFirebase(bundle)?.projectId).toBe("my-app");
  });

  it("falls back to the auth domain when projectId is minified away", () => {
    expect(detectFirebase(`a="cool-startup.firebaseapp.com"`)?.projectId).toBe("cool-startup");
  });

  it("falls back to the storage bucket", () => {
    expect(detectFirebase(`b:"side-project.appspot.com"`)?.projectId).toBe("side-project");
  });

  it("prefers the database URL the app actually declares", () => {
    const bundle = `{projectId:"my-app",databaseURL:"https://my-app-euw1.europe-west1.firebasedatabase.app"}`;
    expect(detectFirebase(bundle)?.databaseUrl).toBe(
      "https://my-app-euw1.europe-west1.firebasedatabase.app",
    );
  });

  it("assumes the default RTDB instance when none is declared", () => {
    expect(detectFirebase(`{projectId:"my-app",authDomain:"my-app.firebaseapp.com"}`)?.databaseUrl).toBe(
      "https://my-app-default-rtdb.firebaseio.com",
    );
  });

  // `projectId` is a generic config key — Google Cloud and Sentry both use it.
  // Probing a stranger's Firestore because an unrelated app happened to ship
  // that key would be both wrong and rude.
  it("ignores a bare projectId with no Firebase anywhere in sight", () => {
    expect(detectFirebase(`const cfg={projectId:"some-gcp-thing",region:"us"}`)).toBeNull();
  });

  // An AIza key is deliberately public and ships in plenty of apps that use no
  // Firebase database at all — on its own it must never trigger a probe.
  it("does not fire on a Google API key alone", () => {
    expect(detectFirebase(`const k="AIzaSyD-abcdefghijklmnopqrstuvwxyz123"`)).toBeNull();
  });

  it("returns null for an app with no Firebase at all", () => {
    expect(detectFirebase("const total = a + b;")).toBeNull();
  });
});

describe("isOpenRealtimeDb", () => {
  it("flags a shallow read that returned keys", () => {
    expect(isOpenRealtimeDb(200, { users: true, orders: true })).toBe(true);
  });

  it("does not flag locked rules, an empty database, or a failed request", () => {
    expect(isOpenRealtimeDb(401, { error: "Permission denied" })).toBe(false);
    expect(isOpenRealtimeDb(200, {})).toBe(false);
    expect(isOpenRealtimeDb(200, null)).toBe(false);
    expect(isOpenRealtimeDb(0, null)).toBe(false);
  });
});

describe("keysFromShallow", () => {
  it("returns the top-level names only", () => {
    expect(keysFromShallow({ users: true, posts: true })).toEqual(["users", "posts"]);
  });
  it("is empty for anything that isn't an object", () => {
    expect(keysFromShallow(null)).toEqual([]);
    expect(keysFromShallow([1, 2])).toEqual([]);
  });
});

describe("isOpenFirestore", () => {
  const doc = { documents: [{ name: "…/users/abc", fields: { email: { stringValue: "x" } } }] };

  it("flags a collection that returned documents unauthenticated", () => {
    expect(isOpenFirestore(200, doc)).toBe(true);
  });

  it("does not flag denied rules or an empty collection", () => {
    expect(isOpenFirestore(403, { error: {} })).toBe(false);
    expect(isOpenFirestore(200, {})).toBe(false);
    expect(isOpenFirestore(200, { documents: [] })).toBe(false);
  });
});

describe("fieldsFromFirestoreDoc", () => {
  // The proof shown to the owner is field NAMES; the typed values Firestore
  // wraps them in are never read.
  it("returns field names, never values", () => {
    const body = {
      documents: [
        {
          fields: {
            email: { stringValue: "someone@example.com" },
            stripe_customer_id: { stringValue: "cus_123" },
          },
        },
      ],
    };
    expect(fieldsFromFirestoreDoc(body)).toEqual(["email", "stripe_customer_id"]);
    expect(JSON.stringify(fieldsFromFirestoreDoc(body))).not.toContain("example.com");
  });

  it("is empty when there's nothing to read", () => {
    expect(fieldsFromFirestoreDoc({ documents: [] })).toEqual([]);
    expect(fieldsFromFirestoreDoc(null)).toEqual([]);
    expect(fieldsFromFirestoreDoc({ documents: [{}] })).toEqual([]);
  });
});
