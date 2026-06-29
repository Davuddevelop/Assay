import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "assay" });

/**
 * Event payloads. The scan API only *sends* `app/scan.requested` (returning
 * fast); the durable function does the actual fetching + analysis.
 */
export interface ScanRequestedEventData {
  scanId: string;
}

export const EVENTS = {
  scanRequested: "app/scan.requested",
} as const;
