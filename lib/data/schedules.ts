import { createServiceClient } from "@/lib/supabase/client";
import { unwrap } from "./helpers";

export type ScheduleRow = {
  id: string;
  source_id: string;
  /** Exact 64-bit Oxylabs schedule id as text (AGENTS.md section 18). */
  oxylabs_schedule_id: string;
  schedule_name: string | null;
  status: string;
  created_at: string;
};

export interface ScheduleInsert {
  source_id: string;
  oxylabs_schedule_id: string;
  schedule_name?: string | null;
  status?: string;
}

/** Create or update an Oxylabs schedule row (keyed by oxylabs_schedule_id). */
export async function upsertSchedule(input: ScheduleInsert): Promise<ScheduleRow> {
  const client = createServiceClient();
  const res = await client
    .from("oxylabs_schedules")
    .upsert(input, { onConflict: "oxylabs_schedule_id" })
    .select()
    .single();
  return unwrap(res, "upsertSchedule");
}

/** All stored schedules with their source details. */
export async function listSchedules(): Promise<ScheduleRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("oxylabs_schedules")
    .select("*")
    .order("created_at", { ascending: false });
  return unwrap(res, "listSchedules");
}

/** All Oxylabs schedule ids currently stored (for orphan deactivation). */
export async function listOxylabsScheduleIds(): Promise<string[]> {
  const client = createServiceClient();
  const res = await client.from("oxylabs_schedules").select("oxylabs_schedule_id");
  const rows = unwrap(res, "listOxylabsScheduleIds");
  return rows.map((r) => r.oxylabs_schedule_id);
}

export async function removeSchedule(id: string): Promise<void> {
  const client = createServiceClient();
  const res = await client.from("oxylabs_schedules").delete().eq("id", id);
  if (res.error) {
    throw new Error(`removeSchedule: ${res.error.message}`);
  }
}

export async function updateScheduleStatus(id: string, status: string): Promise<void> {
  const client = createServiceClient();
  const res = await client.from("oxylabs_schedules").update({ status }).eq("id", id);
  if (res.error) {
    throw new Error(`updateScheduleStatus: ${res.error.message}`);
  }
}
