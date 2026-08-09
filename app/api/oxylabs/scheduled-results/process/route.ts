import { NextResponse } from "next/server";

import { processScheduledResults } from "@/lib/pipeline/process-scheduled";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";

/**
 * Scheduler result processing route (AGENTS.md section 18): consumes
 * completed Oxylabs runs (`result_status === "done"`), feeds the job HTML into
 * the shared scrape pipeline, and returns the pipeline summary. Requires the
 * `x-nicerella-admin-secret` header; 401 otherwise. This is the manual trigger
 * until Vercel Cron is configured.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Processing consumes Oxylabs job results — throttle to avoid redundant runs.
  const rateLimitResponse = guardRateLimit(request, { limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const result = await processScheduledResults();
    return NextResponse.json(result);
  } catch (error) {
    await writeLog("error", "api/oxylabs/scheduled-results/process", "scheduled processing failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Scheduled processing failed" }, { status: 500 });
  }
}
