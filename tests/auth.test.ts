import { describe, it, expect } from "vitest";
import type { User } from "@supabase/supabase-js";

import { githubIdFromUser, toSessionUser } from "@/lib/auth";

function makeUser(partial: Partial<User>): User {
  return {
    id: "uuid-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
    ...partial,
  } as User;
}

describe("auth helpers", () => {
  it("reads the GitHub id from user_metadata.provider_id", () => {
    const u = makeUser({ user_metadata: { provider_id: "12345" } });
    expect(githubIdFromUser(u)).toBe(12345);
  });

  it("falls back to the github identity id", () => {
    const u = makeUser({
      user_metadata: {},
      identities: [
        // @ts-expect-error minimal identity shape for the test
        { provider: "github", id: "67890" },
      ],
    });
    expect(githubIdFromUser(u)).toBe(67890);
  });

  it("returns null when no github id is present", () => {
    expect(githubIdFromUser(makeUser({ user_metadata: {} }))).toBeNull();
  });

  it("derives a session view (handle, name, initial)", () => {
    const u = makeUser({
      user_metadata: { user_name: "davud", full_name: "Davud Ali", avatar_url: "x" },
    });
    const s = toSessionUser(u);
    expect(s.handle).toBe("davud");
    expect(s.name).toBe("Davud Ali");
    expect(s.initial).toBe("D");
    expect(s.avatarUrl).toBe("x");
  });
});
