/**
 * What the scan actually managed to examine.
 *
 * The bug this exists to close: `scoreFindings` certifies on an absence of
 * findings, and an absence of findings has two completely different causes.
 * Either every check ran and found nothing, or a check never ran at all. Those
 * produced an identical verdict — a clean bill and a hallmark — which means
 * the easiest way to earn the mark was to be un-scannable.
 *
 * `looksUnscannable` already refuses the loudest version of this (a WAF page,
 * a bot challenge, a placeholder). It cannot catch the quiet one: a real app
 * that renders properly, ships bundles, and simply never revealed a backend —
 * because its Supabase URL is on a custom domain, or split across strings by
 * the minifier, or because it talks to the database through its own server
 * where a public scanner cannot follow. In every one of those cases the
 * database check silently does not run, and the report says "no issues found".
 *
 * So coverage is reported as its own fact, next to the findings and never
 * folded into them. A check that did not run is not a pass and is not a
 * failure; it is a gap, and the report has to be able to say which is which.
 * CLAUDE.md §4: honesty about limits is a feature.
 *
 * Pure — no I/O — so the rules can be tested directly.
 */

type CheckId = "secrets" | "database" | "storage" | "files" | "headers";

type CoverageStatus =
  /** Ran against something real. A clean result here means something. */
  | "examined"
  /** Nothing of this kind was found to examine. Not a pass. */
  | "nothing-to-check"
  /** We tried and could not finish — blocked, timed out, unreachable. */
  | "incomplete";

export interface CheckCoverage {
  id: CheckId;
  label: string;
  status: CoverageStatus;
  /** Plain-language, written for someone who cannot read code. */
  detail: string;
}

/** What the scan observed, as far as coverage is concerned. */
export interface ScanObservations {
  /** JS bundles successfully downloaded and read. */
  bundleCount: number;
  /** A Supabase or Firebase reference was found in the public code. */
  backendDetected: boolean;
  /** Which one, for the copy. */
  backendName: string | null;
  /** The bundle crawl hit its cap or its deadline, so some code went unread. */
  bundleCrawlTruncated: boolean;
  /** The page never really showed us the app (WAF, login wall, placeholder). */
  unscannable: boolean;
}

/**
 * The database line, which is the one that actually misleads people.
 *
 * Deliberately phrased so that "we found no database" can never be read as
 * "your database is fine". The two possible causes are both stated, because
 * from outside the app they are genuinely indistinguishable and pretending
 * otherwise is the whole problem.
 */
function databaseCoverage(o: ScanObservations): CheckCoverage {
  if (o.unscannable) {
    return {
      id: "database",
      label: "Database",
      status: "incomplete",
      detail:
        "We never saw your app, so we never looked for a database. This is not a clean result.",
    };
  }
  if (o.backendDetected) {
    return {
      id: "database",
      label: "Database",
      status: "examined",
      detail: `Found ${o.backendName} in your app's public code and checked whether its data can be read without a login.`,
    };
  }
  return {
    id: "database",
    label: "Database",
    status: "nothing-to-check",
    detail:
      "No database was found in the code your app ships to browsers. Either it doesn't use one, or it reaches it through your own server, where an outside check can't follow. Either way, your database was not examined — this is not the same as it being safe.",
  };
}

function storageCoverage(o: ScanObservations): CheckCoverage {
  if (o.backendDetected) {
    return {
      id: "storage",
      label: "File storage",
      status: "examined",
      detail: "Checked whether uploaded files can be listed or read by anyone.",
    };
  }
  return {
    id: "storage",
    label: "File storage",
    status: "nothing-to-check",
    detail:
      "No file storage was found in your app's public code, so none was examined.",
  };
}

function secretsCoverage(o: ScanObservations): CheckCoverage {
  if (o.unscannable) {
    return {
      id: "secrets",
      label: "Exposed secrets",
      status: "incomplete",
      detail: "We never saw your app's real code, so nothing was searched.",
    };
  }
  if (o.bundleCount === 0) {
    return {
      id: "secrets",
      label: "Exposed secrets",
      status: "incomplete",
      detail:
        "We read your page but found no JavaScript files to search. If your app does ship code, we couldn't reach it — so a clean result here means very little.",
    };
  }
  if (o.bundleCrawlTruncated) {
    return {
      id: "secrets",
      label: "Exposed secrets",
      status: "incomplete",
      detail: `Searched ${o.bundleCount} code files, but your app ships more than we read in one pass. A key could be hiding in the ones we didn't reach.`,
    };
  }
  return {
    id: "secrets",
    label: "Exposed secrets",
    status: "examined",
    detail: `Searched the page and all ${o.bundleCount} code file${o.bundleCount === 1 ? "" : "s"} your app ships to browsers.`,
  };
}

/**
 * Full coverage for a scan.
 *
 * Files and headers are always genuinely examined — they need no detection
 * step, because we ask for fixed paths and read the response headers we
 * already have. They are listed anyway: a coverage report that only mentions
 * the gaps reads as a list of failures rather than as an account of what was
 * done.
 */
export function computeCoverage(o: ScanObservations): CheckCoverage[] {
  return [
    secretsCoverage(o),
    databaseCoverage(o),
    storageCoverage(o),
    {
      id: "files",
      label: "Exposed files",
      status: o.unscannable ? "incomplete" : "examined",
      detail: o.unscannable
        ? "We never saw your app, so this was not checked."
        : "Asked for the config and backup files that leak most often.",
    },
    {
      id: "headers",
      label: "Security headers",
      status: o.unscannable ? "incomplete" : "examined",
      detail: o.unscannable
        ? "We never saw your app, so this was not checked."
        : "Read the headers your app sends with every response.",
    },
  ];
}

/**
 * Is a clean result from this scan worth anything?
 *
 * False whenever any check could not run. That is a deliberately strict bar:
 * the mark is the product's entire credibility, and a mark that can be earned
 * by hiding — or simply by keeping your database somewhere the scanner can't
 * see — is worth nothing to the client it is shown to.
 *
 * Note this says nothing about whether issues were found. A scan can be
 * conclusive and full of problems, or clean and inconclusive. They are
 * separate questions and the report has to answer both.
 */
export function isConclusive(coverage: readonly CheckCoverage[]): boolean {
  return coverage.every((c) => c.status === "examined");
}

/** The checks that did not actually run, for the report's gap list. */
export function gaps(coverage: readonly CheckCoverage[]): CheckCoverage[] {
  return coverage.filter((c) => c.status !== "examined");
}
