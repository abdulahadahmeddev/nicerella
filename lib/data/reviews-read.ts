import { createServiceClient } from "@/lib/supabase/client";
import { unwrap } from "./helpers";

/**
 * Read-side reviews access for the AI analysis step (AGENTS.md section 19).
 * The trust analysis needs the actual review text, so this loads a bounded,
 * newest-first slice of a product's reviews — never the whole table.
 */

export interface ReviewForAnalysis {
  id: string;
  rating: number | null;
  raw_text: string;
  review_date: string | null;
  verified_purchase: boolean | null;
}

/** Maximum review text characters included per review. */
const MAX_TEXT_CHARS = 4000;
/** Maximum reviews analyzed per product. */
const MAX_REVIEWS_PER_PRODUCT = 40;

/** Load a bounded slice of a product's reviews, newest first. */
export async function listReviewsForAnalysis(
  productId: string,
): Promise<ReviewForAnalysis[]> {
  const client = createServiceClient();
  const res = await client
    .from("reviews")
    .select("id, rating, raw_text, review_date, verified_purchase")
    .eq("product_id", productId)
    .order("review_date", { ascending: false, nullsFirst: false })
    .limit(MAX_REVIEWS_PER_PRODUCT);

  const rows = unwrap(res, "listReviewsForAnalysis");
  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    raw_text: (row.raw_text ?? "").slice(0, MAX_TEXT_CHARS),
    review_date: row.review_date,
    verified_purchase: row.verified_purchase,
  }));
}
