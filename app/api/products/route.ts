import { NextResponse } from "next/server";

import { getProducts } from "@/lib/api/products";
import { writeLog } from "@/lib/data/logs";

/**
 * Home-grid products (AGENTS.md section 18): only analyzed products appear,
 * each with its trust score, review count, and source name. Public read route
 * powering any client-side callers — no admin secret required.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return NextResponse.json(await getProducts());
  } catch (error) {
    await writeLog("error", "api/products", "failed to list analyzed products", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
