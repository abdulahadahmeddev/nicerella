import "server-only";

import { oxyFetch } from "./client";

/**
 * Oxylabs Scheduler API client (AGENTS.md section 18).
 *
 * CRITICAL precision rule: `schedule_id` and job `id` are 64-bit integers that
 * exceed Number.MAX_SAFE_INTEGER. They are captured from the raw HTTP response
 * text via regex BEFORE any JSON.parse, and returned as exact strings. Never
 * convert a parsed JS number back to a string — precision is already lost.
 */

const SCHEDULES_PATH = "/schedules";

export interface ScheduleItem {
  source: string;
  /** `universal` items use `url` + optional `render`. */
  url?: string;
  render?: boolean;
  /** `amazon_search`/`amazon_product` items use `query` (terms or ASIN). */
  query?: string;
  domain?: string;
}

export interface CreateScheduleInput {
  cron: string;
  items: ScheduleItem[];
  end_time: string;
}

export interface ScheduleRun {
  runId: string;
  jobs: Array<{ jobId: string; resultStatus: string | null }>;
}

/** `POST /v1/schedules` — create a schedule; returns the exact 64-bit id as text. */
export async function createOxylabsSchedule(
  input: CreateScheduleInput,
): Promise<{ scheduleId: string }> {
  const res = await oxyFetch(`${SCHEDULES_PATH}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const raw = await res.text();
  const id = matchFirstNumber(raw, '"schedule_id"');
  if (!id) {
    throw new Error(`Oxylabs schedule create: no schedule_id in response: ${raw.slice(0, 200)}`);
  }
  return { scheduleId: id };
}

/**
 * `GET /v1/schedules` — list every Oxylabs schedule id as exact text strings.
 * Used for orphan-schedule deactivation.
 */
export async function listOxylabsSchedules(): Promise<string[]> {
  const res = await oxyFetch(`${SCHEDULES_PATH}`);
  const raw = await res.text();
  // The response is `{"schedules": [ <64-bit ids> ]}` — capture each exact
  // digit sequence from the raw text, never via JSON.parse.
  const ids: string[] = [];
  const idPattern = /(\d{10,})/g;
  let match: RegExpExecArray | null;
  while ((match = idPattern.exec(raw)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

/**
 * `GET /v1/schedules/{id}/runs` — runs with per-job `result_status`. The
 * schedule id is passed as the exact text string captured at creation time.
 */
export async function listScheduleRuns(scheduleId: string): Promise<ScheduleRun[]> {
  const res = await oxyFetch(`${SCHEDULES_PATH}/${scheduleId}/runs`);
  const raw = await res.text();
  const runs: ScheduleRun[] = [];

  // Split the raw text into per-run objects to avoid cross-run ID confusion.
  const runBlocks = splitJsonObjects(raw, "run_id");
  for (const block of runBlocks) {
    const runId = matchFirstNumber(block, '"run_id"');
    if (!runId) continue;
    const jobs: ScheduleRun["jobs"] = [];
    const jobPattern = /\{"id":\s*(\d+),\s*"create_status_code":\s*(\d+),\s*"result_status":\s*"([^"]*)"/g;
    let jobMatch: RegExpExecArray | null;
    while ((jobMatch = jobPattern.exec(block)) !== null) {
      jobs.push({ jobId: jobMatch[1], resultStatus: jobMatch[3] || null });
    }
    runs.push({ runId, jobs });
  }
  return runs;
}

/**
 * `PUT /v1/schedules/{id}/state` — activate or deactivate a schedule
 * (orphan deactivation, AGENTS.md section 18).
 */
export async function setOxylabsScheduleState(
  scheduleId: string,
  active: boolean,
): Promise<void> {
  await oxyFetch(`${SCHEDULES_PATH}/${scheduleId}/state`, {
    method: "PUT",
    body: JSON.stringify({ active }),
  });
}

/**
 * Pull the exact integer next to a JSON key from raw response text.
 * Returns the full digit string (no precision loss).
 */
function matchFirstNumber(raw: string, key: string): string | null {
  const pattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*(\\d+)`);
  const match = pattern.exec(raw);
  return match ? match[1] : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Naively split a JSON array of run objects on each `"run_id"` key so the job
 * regex runs against one run's worth of text at a time. Good enough for ID
 * extraction; we never parse these numbers numerically.
 */
function splitJsonObjects(raw: string, key: string): string[] {
  const marker = `"${key}"`;
  const parts = raw.split(marker);
  const blocks: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    blocks.push(`${marker}${parts[i]}`);
  }
  return blocks;
}
