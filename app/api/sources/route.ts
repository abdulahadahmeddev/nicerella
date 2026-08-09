import { NextResponse } from "next/server";

import { listSources } from "@/lib/data/sources";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";

/**
 * Operational read route (AGENTS.md sections 14–15): lists all stored
 * sources. Requires the `x-nicerella-admin-secret` header; 401 otherwise.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Operational read route — default 60 req/min per client is plenty.
  const rateLimitResponse = guardRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const sources = await listSources();
    return NextResponse.json(sources);
  } catch (error) {
    await writeLog("error", "api/sources", "failed to list sources", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }
}
