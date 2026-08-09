import { NextResponse } from "next/server";

import { runScrapePipeline } from "@/lib/pipeline/scrape";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";

/**
 * Manual scraping route (AGENTS.md section 16). Runs the shared scrape-to-insert
 * pipeline live: loads active sources from Supabase, fetches each listing page
 * through Oxylabs, extracts + dedupes product links, scrapes detail pages and
 * reviews, validates, and inserts append-only. Requires the
 * `x-nicerella-admin-secret` header; 401 otherwise.
 *
 * Optional body: `{ sourceIds?: string[], limitPerSource?: number }`.
 * Returns the run summary object (section 9 run logging).
 */
export const dynamic = "force-dynamic";

const MAX_LIMIT_PER_SOURCE = 20;

interface ScrapeBody {
  sourceIds?: string[];
  limitPerSource?: number;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Scraping is expensive (live Oxylabs fetches) — allow at most 5 runs/minute.
  const rateLimitResponse = guardRateLimit(request, { limit: 5, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  let body: ScrapeBody = {};
  try {
    const parsed = await request.json();
    body = (parsed ?? {}) as ScrapeBody;
  } catch {
    // Empty body is fine — defaults apply.
  }

  const sourceIds =
    Array.isArray(body.sourceIds) && body.sourceIds.length > 0
      ? body.sourceIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        )
      : undefined;

  const rawLimit = Number(body.limitPerSource);
  const limitPerSource = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT_PER_SOURCE)
    : undefined;

  try {
    const summary = await runScrapePipeline({
      source: "manual",
      sourceIds,
      limitPerSource,
    });
    return NextResponse.json(summary);
  } catch (error) {
    await writeLog("error", "api/scrape", "manual scrape run failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Scrape run failed" }, { status: 500 });
  }
}
