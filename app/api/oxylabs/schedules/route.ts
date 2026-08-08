import { NextResponse } from "next/server";

import { listSchedules } from "@/lib/data/schedules";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { writeLog } from "@/lib/data/logs";
import {
  syncOxylabsSchedules,
  DEFAULT_CRON,
} from "@/lib/pipeline/schedule-sync";

/**
 * Operational route (AGENTS.md section 18). GET lists stored Oxylabs
 * schedules (ids kept as text to preserve 64-bit precision). POST creates
 * schedules for active source listing pages, stores the exact 64-bit ids as
 * text, and deactivates orphan schedules. Both require the
 * `x-nicerella-admin-secret` header; 401 otherwise.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schedules = await listSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    await writeLog("error", "api/oxylabs/schedules", "failed to list schedules", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load schedules" }, { status: 500 });
  }
}

interface SyncBody {
  cron?: string;
}

/** One-time setup: tell Oxylabs what to scrape on schedule (section 18). */
export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncBody = {};
  try {
    const parsed = await request.json();
    body = (parsed ?? {}) as SyncBody;
  } catch {
    // Empty body is fine — default cron applies.
  }

  const cron =
    typeof body.cron === "string" && body.cron.length > 0
      ? body.cron
      : DEFAULT_CRON;

  try {
    const result = await syncOxylabsSchedules(cron);
    return NextResponse.json(result);
  } catch (error) {
    await writeLog("error", "api/oxylabs/schedules", "schedule sync failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Schedule sync failed" }, { status: 500 });
  }
}
