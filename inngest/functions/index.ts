import { runScan } from "@/inngest/functions/run-scan";

/** All durable Inngest functions, registered by the serve route. */
export const functions = [runScan];
