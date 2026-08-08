import type { Json } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/client";
import { DEFAULT_LIST_LIMIT, unwrap } from "./helpers";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogRow {
  id: number;
  level: string;
  source: string;
  message: string;
  context: Json | null;
  created_at: string;
}

/**
 * Server-side pipeline/operation logging (AGENTS.md section 9 "run logging").
 * The pipeline writes here instead of console.log so logs are queryable.
 */
export async function writeLog(
  level: LogLevel,
  source: string,
  message: string,
  context?: Json,
): Promise<void> {
  // Console mirror (AGENTS.md sections 9/16): progress is logged to the
  // terminal too, so `next dev` shows each scrape/analysis step live.
  if (level === "error") {
    console.error(`[nicerella] ${level.toUpperCase()} [${source}] ${message}`, context ?? "");
  } else {
    console.log(`[nicerella] ${level.toUpperCase()} [${source}] ${message}`, context ?? "");
  }

  const client = createServiceClient();
  const res = await client.from("logs").insert({
    level,
    source,
    message,
    context: context ?? null,
  });
  if (res.error) {
    // Logging must never crash the pipeline; surface loudly instead.
    console.error(`[logs] failed to persist log entry: ${res.error.message}`);
  }
}

/** Most recent log entries, optionally filtered by level. */
export async function listLogs(
  limit: number = DEFAULT_LIST_LIMIT,
  level?: LogLevel,
): Promise<LogRow[]> {
  const client = createServiceClient();
  let query = client
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (level) {
    query = query.eq("level", level);
  }
  return unwrap(await query, "listLogs");
}
