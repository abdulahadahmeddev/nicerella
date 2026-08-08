import { createServiceClient } from "@/lib/supabase/client";
import { unwrap } from "./helpers";

export type ScheduleRunRow = {
  id: string;
  schedule_id: string;
  oxylabs_run_id: string | null;
  job_id: string | null;
  status: string | null;
  result_status: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export interface ScheduleRunInsert {
  schedule_id: string;
  oxylabs_run_id?: string | null;
  job_id?: string | null;
  status?: string | null;
  result_status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/** Create or update a run row (keyed by oxylabs_run_id when present). */
export async function upsertScheduleRun(
  input: ScheduleRunInsert,
): Promise<ScheduleRunRow | null> {
  const client = createServiceClient();
  const res = await client
    .from("oxylabs_schedule_runs")
    .upsert(input, {
      onConflict: "oxylabs_run_id",
      ignoreDuplicates: true,
    })
    .select()
    .maybeSingle();
  if (res.error) {
    throw new Error(`upsertScheduleRun: ${res.error.message}`);
  }
  return res.data;
}

export async function updateRunResultStatus(
  id: string,
  resultStatus: string,
  completedAt?: string,
): Promise<void> {
  const client = createServiceClient();
  const res = await client
    .from("oxylabs_schedule_runs")
    .update({ result_status: resultStatus, completed_at: completedAt ?? null })
    .eq("id", id);
  if (res.error) {
    throw new Error(`updateRunResultStatus: ${res.error.message}`);
  }
}

/** Runs for a schedule (or all), newest first. */
export async function listScheduleRuns(scheduleId?: string): Promise<ScheduleRunRow[]> {
  const client = createServiceClient();
  let query = client
    .from("oxylabs_schedule_runs")
    .select("*")
    .order("created_at", { ascending: false });
  if (scheduleId) {
    query = query.eq("schedule_id", scheduleId);
  }
  return unwrap(await query, "listScheduleRuns");
}

/** Runs whose Oxylabs job is done and ready to fetch results. */
export async function listDoneRuns(): Promise<ScheduleRunRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("oxylabs_schedule_runs")
    .select("*")
    .eq("result_status", "done")
    .order("created_at", { ascending: false });
  return unwrap(res, "listDoneRuns");
}
