import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { processScheduledResults } from "@/lib/pipeline/process-scheduled";
import { runAnalysisPipeline } from "@/lib/pipeline/analyze";
import { writeLog } from "@/lib/data/logs";
import { PRODUCTS_CACHE_TAG } from "@/lib/api/products";

/**
 * Automatic pipeline cron route (AGENTS.md section 18). Vercel Cron fires
 * this after each Oxylabs run so the pipeline is fully automatic:
 *   step one — process completed scheduled results (scrape-to-insert),
 *   step two — run AI trust analysis on every product still pending analysis.
 * If step one fails, step two still runs — there may be pre-existing
 * unanalyzed products.
 *
 * Protected by the CRON_SECRET env var, which Vercel injects automatically on
 * every cron request (sent as `Authorization: Bearer <CRON_SECRET>`). In local
 * development the check is skipped so the route can be tested manually. This
 * is the only GET action route in the app; it is internal-only and never
 * callable by browsers or users.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await writeLog("info", "api/cron/pipeline", "pipeline cron started");

  // Step one: process completed scheduled results.
  let processed: Awaited<ReturnType<typeof processScheduledResults>> | null = null;
  let processedError: string | null = null;
  try {
    processed = await processScheduledResults();
    await writeLog("info", "api/cron/pipeline", "cron step one (process) completed");
  } catch (error) {
    processedError = error instanceof Error ? error.message : String(error);
    await writeLog("error", "api/cron/pipeline", "cron step one (process) failed", {
      message: processedError,
    });
  }

  // Step two: analyze everything still pending. Runs even when step one failed.
  let analyzed: Awaited<ReturnType<typeof runAnalysisPipeline>> | null = null;
  let analyzedError: string | null = null;
  try {
    analyzed = await runAnalysisPipeline();
    await writeLog("info", "api/cron/pipeline", "cron step two (analyze) completed");
  } catch (error) {
    analyzedError = error instanceof Error ? error.message : String(error);
    await writeLog("error", "api/cron/pipeline", "cron step two (analyze) failed", {
      message: analyzedError,
    });
  }

  // Bust the public-products cache so newly scraped/analyzed products show up
  // on the home grid and detail pages without waiting out the 5-minute TTL.
  // profile "max" = stale-while-revalidate (Next 16 requires the second arg).
  revalidateTag(PRODUCTS_CACHE_TAG, "max");

  const status =
    processedError == null && analyzedError == null
      ? "completed"
      : processedError != null && analyzedError != null
        ? "failed"
        : "partial";

  return NextResponse.json({
    status,
    processed,
    processed_error: processedError,
    analyzed,
    analyzed_error: analyzedError,
  });
}

/**
 * Local development: skip the secret check so the route can be tested
 * manually. Production: compare the `Authorization: Bearer <secret>` header
 * against CRON_SECRET with a timing-safe comparison.
 */
function isCronAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
