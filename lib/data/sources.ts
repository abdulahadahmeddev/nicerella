import { createServiceClient } from "@/lib/supabase/client";
import { unwrap } from "./helpers";

export type SourceRow = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  logo_url: string | null;
  active: boolean;
  created_at: string;
};

export interface SourceInsert {
  name: string;
  listing_url: string;
  parser_strategy?: string | null;
  logo_url?: string | null;
  active?: boolean;
}

/** All sources, most recently created first. */
export async function listSources(): Promise<SourceRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });
  return unwrap(res, "listSources");
}

/** Only sources currently active (used for scraping and scheduling). */
export async function listActiveSources(): Promise<SourceRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("sources")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });
  return unwrap(res, "listActiveSources");
}

export async function getSourceById(id: string): Promise<SourceRow | null> {
  const client = createServiceClient();
  const res = await client.from("sources").select("*").eq("id", id).maybeSingle();
  if (res.error) {
    throw new Error(`getSourceById: ${res.error.message}`);
  }
  return res.data;
}

/** Create or update a source (matched by listing_url). */
export async function upsertSource(input: SourceInsert): Promise<SourceRow> {
  const client = createServiceClient();
  const res = await client
    .from("sources")
    .upsert(input, { onConflict: "listing_url" })
    .select()
    .single();
  return unwrap(res, "upsertSource");
}

export async function setSourceActive(id: string, active: boolean): Promise<void> {
  const client = createServiceClient();
  const res = await client.from("sources").update({ active }).eq("id", id);
  if (res.error) {
    throw new Error(`setSourceActive: ${res.error.message}`);
  }
}
