import { createServiceClient } from "@/lib/supabase/client";

export interface SimilarProductRow {
  id: string;
  title: string;
  image_url: string;
  price: number | null;
  category: string | null;
  original_url: string;
  source_id: string;
  trust_score: number;
  trust_label: string;
  similarity: number;
}

/**
 * "Similar products" via pgvector cosine similarity (AGENTS.md section 20),
 * scoped to the same category. Returns [] when the product has no embedding
 * yet or no matches clear the similarity threshold.
 *
 * Read-only, server-side only — never callable from client code.
 */
export async function findSimilarProducts(
  productId: string,
  category: string | null,
  count = 6,
): Promise<SimilarProductRow[]> {
  const client = createServiceClient();

  const analysisRes = await client
    .from("product_trust_analyses")
    .select("embedding")
    .eq("product_id", productId)
    .maybeSingle();
  if (analysisRes.error) {
    throw new Error(`findSimilarProducts: ${analysisRes.error.message}`);
  }
  const embedding = analysisRes.data?.embedding;
  if (!embedding) return [];

  const res = await client.rpc("match_similar_products", {
    query_embedding: embedding,
    match_category: category,
    match_count: count,
    exclude_product_id: productId,
  });
  if (res.error) {
    throw new Error(`findSimilarProducts: ${res.error.message}`);
  }
  return res.data ?? [];
}
