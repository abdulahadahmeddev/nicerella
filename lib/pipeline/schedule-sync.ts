import "server-only";

import {
  createOxylabsSchedule,
  listOxylabsSchedules,
  setOxylabsScheduleState,
  type ScheduleItem,
} from "@/lib/oxylabs/scheduler";
import {
  extractAmazonSearchQuery,
  oxylabsSourceTypeForParser,
} from "@/lib/oxylabs/client";
import { listActiveSources } from "@/lib/data/sources";
import {
  listOxylabsScheduleIds,
  listSchedules,
  upsertSchedule,
} from "@/lib/data/schedules";
import { writeLog } from "@/lib/data/logs";

/**
 * Oxylabs Scheduler sync (AGENTS.md section 18). One-time setup that tells
 * Oxylabs what to scrape on a recurring schedule:
 *  1. create a schedule per active source listing page that has none,
 *  2. store the exact 64-bit schedule ids as text,
 *  3. deactivate any remote schedule not stored in the DB (orphan cleanup).
 *
 * Independent of Vercel Cron — both must be set up for a fully automatic
 * pipeline, but neither triggers the other.
 */

export const DEFAULT_CRON = "0 9 * * *";
const END_TIME_YEARS = 2;
const SCHEDULE_NAME_PREFIX = "nicerella:";

export interface StoredScheduleRow {
  source_id: string;
  oxylabs_schedule_id: string;
  schedule_name: string | null;
  status: string;
}

export interface ScheduleSyncResult {
  created: number;
  skipped_existing: number;
  deactivated: number;
  stored: StoredScheduleRow[];
}

export async function syncOxylabsSchedules(
  cron: string = DEFAULT_CRON,
): Promise<ScheduleSyncResult> {
  const sources = await listActiveSources();
  const existingRows = await listSchedules();
  const scheduledSourceIds = new Set(
    existingRows.filter((s) => s.status === "active").map((s) => s.source_id),
  );

  const endTime = isoDateYearsFromNow(END_TIME_YEARS);
  const stored: StoredScheduleRow[] = [];
  let created = 0;
  let skippedExisting = 0;

  for (const source of sources) {
    if (scheduledSourceIds.has(source.id)) {
      skippedExisting += 1;
      await writeLog("info", "pipeline/schedule-sync", `schedule exists, skipping: ${source.name}`, {
        source_id: source.id,
      });
      const existing = existingRows.find((s) => s.source_id === source.id);
      if (existing) stored.push(existing);
      continue;
    }

    await writeLog("info", "pipeline/schedule-sync", `creating schedule: ${source.name}`, {
      source_id: source.id,
      cron,
    });
    const { scheduleId } = await createOxylabsSchedule({
      cron,
      items: [scheduleItemForSource(source)],
      end_time: endTime,
    });

    const row = await upsertSchedule({
      source_id: source.id,
      oxylabs_schedule_id: scheduleId,
      schedule_name: `${SCHEDULE_NAME_PREFIX}${source.name}`,
      status: "active",
    });
    stored.push(row);
    created += 1;
    await writeLog("info", "pipeline/schedule-sync", `schedule created: ${source.name}`, {
      source_id: source.id,
      oxylabs_schedule_id: scheduleId,
    });
  }

  const deactivated = await deactivateOrphans();

  return { created, skipped_existing: skippedExisting, deactivated, stored };
}

/**
 * Deactivate any Oxylabs schedule whose id is not stored in the DB — leftover
 * schedules from rows that were deleted and re-created would otherwise keep
 * running and count against the Oxylabs bill (AGENTS.md section 18).
 */
async function deactivateOrphans(): Promise<number> {
  const [remoteIds, dbIds] = await Promise.all([
    listOxylabsSchedules(),
    listOxylabsScheduleIds(),
  ]);
  const dbSet = new Set(dbIds);
  let deactivated = 0;
  for (const remoteId of remoteIds) {
    if (dbSet.has(remoteId)) continue;
    await setOxylabsScheduleState(remoteId, false);
    deactivated += 1;
    await writeLog("warn", "pipeline/schedule-sync", `orphan schedule deactivated: ${remoteId}`, {
      oxylabs_schedule_id: remoteId,
    });
  }
  return deactivated;
}

/** ISO timestamp a few years in the future for schedule `end_time`. */
function isoDateYearsFromNow(years: number): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() + years);
  return now.toISOString();
}

/**
 * Build the Oxylabs schedule item for a source's listing page, matching the
 * source type used for live manual scraping (section 12). Amazon sources get
 * `amazon_search` (the `universal` source rejects Amazon URLs with HTTP 400);
 * everything else uses `universal`.
 */
function scheduleItemForSource(source: {
  listing_url: string;
  parser_strategy: string | null;
}): ScheduleItem {
  const sourceType = oxylabsSourceTypeForParser(source.parser_strategy, true);
  if (sourceType === "amazon_search") {
    return {
      source: "amazon_search",
      domain: "com",
      query: extractAmazonSearchQuery(source.listing_url),
    };
  }
  return { source: "universal", url: source.listing_url, render: true };
}
