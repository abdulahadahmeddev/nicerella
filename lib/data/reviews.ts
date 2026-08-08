import { createServiceClient } from "@/lib/supabase/client";
import { unwrap } from "./helpers";

export interface ReviewInsert {
  product_id: string;
  review_identifier?: string | null;
  rating: number;
  raw_text: string;
  review_date?: string | null;
  verified_purchase?: boolean;
}

/**
 * Append-only review insertion with dedupe (AGENTS.md section 10):
 * reviews exposing a source `review_identifier` are deduped by
 * (product_id, review_identifier); rows without an identifier are appended.
 * Returns the count of rows actually inserted.
 */
export async function insertReviews(rows: ReviewInsert[]): Promise<number> {
  if (rows.length === 0) return 0;

  const client = createServiceClient();
  const res = await client
    .from("reviews")
    .upsert(rows, {
      onConflict: "product_id,review_identifier",
      ignoreDuplicates: true,
    })
    .select("id");

  if (res.error) {
    throw new Error(`insertReviews: ${res.error.message}`);
  }
  return res.data?.length ?? 0;
}

/** Number of reviews per product, keyed by product id. */
export async function countReviewsByProduct(
  productIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (productIds.length === 0) return counts;

  const client = createServiceClient();
  const res = await client
    .from("reviews")
    .select("product_id")
    .in("product_id", productIds);

  const rows = unwrap(res, "countReviewsByProduct");
  for (const row of rows) {
    counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
  }
  return counts;
}
