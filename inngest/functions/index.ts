import { syncInstall } from "@/inngest/functions/sync-install";
import { runCheck } from "@/inngest/functions/run-check";
import { indexRepo } from "@/inngest/functions/index-repo";

/** All durable Inngest functions, registered by the serve route. */
export const functions = [syncInstall, runCheck, indexRepo];
