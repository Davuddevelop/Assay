import { describe, it, expect } from "vitest";

import { AGENT_TOOLS } from "@/lib/anthropic/agent-tool-defs";

/**
 * The tool schemas are sent verbatim to the Anthropic API on every agent turn.
 * A malformed one fails the whole request with a 400 — and because the chat
 * falls back to a canned reply on any error, that failure is invisible: the
 * agent just quietly stops being able to do anything. These assertions are the
 * only thing standing between a typo and a silently de-toothed agent.
 */
describe("agent tool schemas", () => {
  it("declares a usable set of tools", () => {
    expect(AGENT_TOOLS.length).toBeGreaterThan(0);
  });

  it("gives every tool a unique name", () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const tool of AGENT_TOOLS) {
    describe(tool.name, () => {
      it("uses a snake_case name the API accepts", () => {
        expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      });

      // The description is the only thing telling the model WHEN to reach for
      // a tool. A thin one is why agents under-call their own capabilities.
      it("describes when to use it, not just what it is", () => {
        expect(tool.description.length).toBeGreaterThan(60);
      });

      it("has a valid object input schema", () => {
        expect(tool.input_schema.type).toBe("object");
        expect(tool.input_schema.properties).toBeTypeOf("object");
        expect(Array.isArray(tool.input_schema.required)).toBe(true);
      });

      it("only requires parameters it actually declares", () => {
        const declared = Object.keys(tool.input_schema.properties);
        for (const req of tool.input_schema.required) {
          expect(declared).toContain(req);
        }
      });

      // Every property needs a description — an undescribed parameter is where
      // the model starts inventing plausible-looking values.
      it("describes every parameter", () => {
        for (const [name, spec] of Object.entries(tool.input_schema.properties)) {
          const s = spec as { type?: string; description?: string };
          expect(s.type, `${name} needs a type`).toBeTruthy();
          expect(s.description, `${name} needs a description`).toBeTruthy();
        }
      });
    });
  }

  // The security property this whole design rests on: the app under discussion
  // is bound server-side from an RLS-scoped read. If a tool ever accepted an
  // app url, user id, or scan id as a parameter, a crafted message could aim
  // it at somebody else's app. This test fails the moment that door opens.
  it("never lets the model name the app, the user, or a scan", () => {
    const forbidden = /app_?url|user_?id|account|owner|monitor_?id|scan_?id|target|host|domain/i;
    for (const tool of AGENT_TOOLS) {
      for (const param of Object.keys(tool.input_schema.properties)) {
        expect(param, `${tool.name}.${param} would let the model retarget the tool`).not.toMatch(
          forbidden,
        );
      }
    }
  });
});
