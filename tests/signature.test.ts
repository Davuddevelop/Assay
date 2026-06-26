import { describe, it, expect } from "vitest";
import { sign, verify } from "@octokit/webhooks-methods";

// The webhook route uses @octokit/webhooks-methods `verify` exactly as below.
// These tests pin the contract: a correctly signed body verifies, a tampered
// body or wrong secret does not.
describe("webhook signature verification", () => {
  const secret = "my-test-webhook-secret";
  const body = JSON.stringify({ action: "opened", number: 1 });

  it("accepts a correctly signed payload", async () => {
    const signature = await sign(secret, body);
    expect(await verify(secret, body, signature)).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const signature = await sign(secret, body);
    const tampered = JSON.stringify({ action: "opened", number: 2 });
    expect(await verify(secret, tampered, signature)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const signature = await sign("attacker-secret", body);
    expect(await verify(secret, body, signature)).toBe(false);
  });
});
