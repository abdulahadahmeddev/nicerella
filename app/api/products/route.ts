import { NextResponse } from "next/server";

import { getProducts, PUBLIC_CACHE_HEADER } from "@/lib/api/products";
import { writeLog } from "@/lib/data/logs";

/**
 * Home-grid products (AGENTS.md section 18): only analyzed products appear,
 * each with its trust score, review count, and source name. Public read route
 * powering any client-side callers — no admin secret required.
 *
 * The underlying reads are cached (unstable_cache, 5-min TTL, revalidated by
 * the pipeline), so the response carries a matching public cache header —
 * CDN/browser cache the JSON for up to 5 minutes with stale-while-revalidate.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return NextResponse.json(await getProducts(), {
      headers: { "Cache-Control": PUBLIC_CACHE_HEADER },
    });
  } catch (error) {
    await writeLog("error", "api/products", "failed to list analyzed products", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
