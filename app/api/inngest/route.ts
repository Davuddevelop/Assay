import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

export const runtime = "nodejs";

// The endpoint Inngest calls to run our durable functions.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
