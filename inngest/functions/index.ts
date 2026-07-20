import { runScan } from "@/inngest/functions/run-scan";
import { recheckApps } from "@/inngest/functions/recheck-apps";
import { weeklyDigest } from "@/inngest/functions/weekly-digest";

/** All durable Inngest functions, registered by the serve route. */
export const functions = [runScan, recheckApps, weeklyDigest];
