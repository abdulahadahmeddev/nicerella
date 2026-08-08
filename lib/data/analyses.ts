import type { Json } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/client";
import { countReviewsByProduct } from "./reviews";
import { unwrap } from "./helpers";

export type AnalysisRow = {
  id: string;
  product_id: string;
  trust_score: number;
  trust_label: string;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  fake_review_pct: number;
  authenticity_confidence: number;
  red_flags: Json;
  neutral_summary: string;
  disclaimer: string | null;
  model_name: string | null;
  created_at: string;
  embedding: string | null;
};

export interface AnalysisInsert {
  product_id: string;
  trust_score: number;
  trust_label: string;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  fake_review_pct: number;
  authenticity_confidence: number;
  red_flags?: Json;
  neutral_summary: string;
  disclaimer?: string | null;
  model_name?: string | null;
  embedding?: string | null;
}

/** One AI trust analysis per product (upsert on product_id). */
export async function insertTrustAnalysis(input: AnalysisInsert): Promise<AnalysisRow> {
  const client = createServiceClient();
  const res = await client
    .from("product_trust_analyses")
    .upsert(input, { onConflict: "product_id" })
    .select()
    .single();
  return unwrap(res, "insertTrustAnalysis");
}

export async function getAnalysisByProduct(productId: string): Promise<AnalysisRow | null> {
  const client = createServiceClient();
  const res = await client
    .from("product_trust_analyses")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();
  if (res.error) {
    throw new Error(`getAnalysisByProduct: ${res.error.message}`);
  }
  return res.data;
}

/** Product awaiting trust analysis (analyzed_at null), with review counts. */
export interface PendingAnalysisRow {
  id: string;
  title: string;
  source_id: string;
  image_url: string;
  first_seen_at: string;
  last_scraped_at: string;
  analyzed_at: string | null;
  review_count: number;
}

/** AGENTS.md section 18 step two — products still pending trust analysis. */
export async function listPendingAnalysisProducts(
  limit = 500,
): Promise<PendingAnalysisRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("products")
    .select("id, title, source_id, image_url, first_seen_at, last_scraped_at, analyzed_at")
    .is("analyzed_at", null)
    .order("last_scraped_at", { ascending: false })
    .limit(limit);

  if (res.error) {
    throw new Error(`listPendingAnalysisProducts: ${res.error.message}`);
  }
  const rows = res.data ?? [];
  const counts = await countReviewsByProduct(rows.map((r) => r.id));

  return rows.map((r) => ({
    ...r,
    analyzed_at: r.analyzed_at,
    review_count: counts.get(r.id) ?? 0,
  }));
}
