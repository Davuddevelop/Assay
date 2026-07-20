import { inngest } from "@/inngest/client";
import { sendWeeklyDigests } from "@/lib/email/notify";
import { log } from "@/lib/log";

/**
 * Weekly digest — Monday 14:00 UTC, one email per watching user summarizing
 * their apps' status and the changes we re-checked that week. Turns quiet,
 * uneventful watching into something the subscriber can see, so the plan never
 * feels like paying for nothing.
 */
export const weeklyDigest = inngest.createFunction(
  {
    id: "weekly-digest",
    name: "Send weekly watch digests",
    triggers: [{ cron: "0 14 * * 1" }],
  },
  async () => {
    const { sent } = await sendWeeklyDigests();
    log.info("weekly digest done", { sent });
    return { sent };
  },
);
