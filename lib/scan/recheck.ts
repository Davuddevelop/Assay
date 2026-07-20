import "server-only";

import { fetchApp } from "@/lib/scan/fetch";
import { scanText } from "@/lib/scan/patterns";
import { checkHeaders } from "@/lib/scan/headers";
import { detectSupabase, probeSupabaseRls } from "@/lib/scan/supabase-rls";
import { probeSupabaseStorage } from "@/lib/scan/storage";
import { probeExposedFiles } from "@/lib/scan/exposed-files";
import { hasSourceMapRef } from "@/lib/scan/bundles";
import type { RawFinding } from "@/lib/scan/types";

/**
 * Is a finding of this exact kind+title still present in a fresh check? Pure —
 * the matching rule the re-check verdict turns on, unit-tested independently of
 * the network. Secrets are matched by title (the specific key); everything else
 * by kind (there's one such finding per check).
 */
export function findingStillPresent(
  found: { kind: string; title: string }[],
  kind: string,
  title: string,
): boolean {
  if (kind === "exposed-secret") {
    return found.some((f) => f.kind === kind && f.title === title);
  }
  return found.some((f) => f.kind === kind);
}

/**
 * Re-check a single finding against the live app — the "I pasted the fix, did it
 * work?" loop. Runs only the one check the finding came from (fast, ~one fetch),
 * SSRF-guarded throughout via fetchApp. Returns whether the issue is resolved.
 */
export async function recheckFinding(
  appUrl: string,
  kind: string,
  title: string,
): Promise<{ resolved: boolean }> {
  const app = await fetchApp(appUrl);
  const allText = [app.html, ...app.bundles.map((b) => b.content)].join("\n");
  const origin = new URL(app.finalUrl).origin;

  let found: RawFinding[] = [];
  switch (kind) {
    case "exposed-secret": {
      found = [
        ...scanText(app.html, "page HTML"),
        ...app.bundles.flatMap((b) => scanText(b.content, "bundle")),
      ];
      break;
    }
    case "missing-header": {
      found = checkHeaders(app.headers);
      break;
    }
    case "supabase-rls": {
      const ref = detectSupabase(allText);
      found = ref ? await probeSupabaseRls(ref).catch(() => []) : [];
      break;
    }
    case "supabase-storage": {
      const ref = detectSupabase(allText);
      found = ref ? await probeSupabaseStorage(ref).catch(() => []) : [];
      break;
    }
    case "open-endpoint": {
      found = await probeExposedFiles(origin).catch(() => []);
      if (app.bundles.some((b) => hasSourceMapRef(b.content))) {
        found.push({
          kind: "open-endpoint",
          severity: "minor",
          title: "Your source code is downloadable",
          detail: "",
          redactedLocation: null,
        });
      }
      break;
    }
    default:
      // Unknown kind — can't re-check in isolation; treat as unresolved so the
      // user re-runs a full scan rather than getting a false "fixed".
      return { resolved: false };
  }

  return { resolved: !findingStillPresent(found, kind, title) };
}
