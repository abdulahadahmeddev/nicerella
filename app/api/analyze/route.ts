import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { runAnalysisPipeline } from "@/lib/pipeline/analyze";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";
import { captureServerEvent } from "@/lib/posthog/server";
import { PRODUCTS_CACHE_TAG } from "@/lib/api/products";

/**
 * Manual AI trust analysis route (AGENTS.md section 19). Picks up products
 * still awaiting analysis (analyzed_at is null) and runs each through the
 * free-tier provider failover chain. Requires the `x-nicerella-admin-secret`
 * header; 401 otherwise. Accepts an optional `{ limit }` body to bound how
 * many products this run analyzes.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AI calls are paid per token — bound how often analysis can be triggered.
  const rateLimitResponse = guardRateLimit(request, { limit: 10, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  let limit: number | undefined;
  try {
    const body = (await request.json()) as { limit?: number };
    if (
      typeof body.limit === "number" &&
      Number.isFinite(body.limit) &&
      body.limit > 0
    ) {
      limit = body.limit;
    }
  } catch {
    // Empty body is fine — the default limit applies.
  }

  try {
    const summary = await runAnalysisPipeline({ limit });
    // Newly analyzed products must appear on the home grid and detail pages
    // immediately — don't wait out the 5-minute products cache TTL. profile
    // "max" = stale-while-revalidate (Next 16 requires the second argument).
    revalidateTag(PRODUCTS_CACHE_TAG, "max");
    captureServerEvent("analysis_pipeline_completed", {
      status: summary.status,
      analyzed: summary.products_analyzed,
      failed: summary.products_failed,
    });
    return NextResponse.json(summary);
  } catch (error) {
    await writeLog("error", "api/analyze", "analysis pipeline failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Analysis pipeline failed" }, { status: 500 });
  }
}
