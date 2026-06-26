import type { FindingSeverity, FindingType } from "@/lib/db/types";

/**
 * The canonical finding shape produced by every check source (AI review,
 * security scan, sandboxed tests) and consumed by the verdict engine, the DB
 * writer, and the report renderer. Keeping one shape lets sources aggregate
 * into a single list.
 */
export interface Finding {
  type: FindingType;
  severity: FindingSeverity;
  message: string;
  file: string | null;
  line: number | null;
  suggestion: string | null;
}
