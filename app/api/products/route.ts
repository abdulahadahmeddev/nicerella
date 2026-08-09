import { NextResponse } from "next/server";

import { getProducts } from "@/lib/api/products";
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

const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=300";

export async function GET(): Promise<Response> {
  try {
    return NextResponse.json(await getProducts(), {
      headers: { "Cache-Control": PUBLIC_CACHE },
    });
  } catch (error) {
    await writeLog("error", "api/products", "failed to list analyzed products", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
