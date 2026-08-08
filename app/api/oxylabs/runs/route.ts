import { NextResponse } from "next/server";

import { listScheduleRuns } from "@/lib/data/schedule-runs";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { writeLog } from "@/lib/data/logs";

/**
 * Operational read route (AGENTS.md section 18): lists Oxylabs schedule
 * runs, newest first. Requires the `x-nicerella-admin-secret` header; 401
 * otherwise. Optional query param: `scheduleId` to filter by schedule.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scheduleId = searchParams.get("scheduleId") ?? undefined;

  try {
    const runs = await listScheduleRuns(scheduleId);
    return NextResponse.json(runs);
  } catch (error) {
    await writeLog("error", "api/oxylabs/runs", "failed to list schedule runs", {
      schedule_id: scheduleId ?? null,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load runs" }, { status: 500 });
  }
}
