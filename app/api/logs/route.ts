import { NextResponse } from "next/server";

import { listLogs, writeLog, type LogLevel } from "@/lib/data/logs";
import { isAdminRequest } from "@/lib/api/admin-secret";
import { DEFAULT_LIST_LIMIT } from "@/lib/data/helpers";

/**
 * Operational read route: most recent pipeline logs, newest first. Requires
 * the `x-nicerella-admin-secret` header; 401 otherwise. Optional query
 * params: `limit` (1–200, default 100) and `level` (info|warn|error|debug).
 */
export const dynamic = "force-dynamic";

const MAX_LOG_LIMIT = 200;
const VALID_LEVELS: ReadonlySet<string> = new Set(["info", "warn", "error", "debug"]);

export async function GET(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LIST_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LOG_LIMIT)
    : DEFAULT_LIST_LIMIT;
  const rawLevel = searchParams.get("level") ?? undefined;
  const level = rawLevel && VALID_LEVELS.has(rawLevel) ? (rawLevel as LogLevel) : undefined;

  try {
    const logs = await listLogs(limit, level);
    return NextResponse.json(logs);
  } catch (error) {
    await writeLog("error", "api/logs", "failed to list logs", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load logs" }, { status: 500 });
  }
}
