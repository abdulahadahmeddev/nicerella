import "server-only";

import { getProductById, listAnalyzedProducts } from "@/lib/data/products";
import { getAnalysisByProduct } from "@/lib/data/analyses";
import { countReviewsByProduct } from "@/lib/data/reviews";
import { getSourceById } from "@/lib/data/sources";
import { findSimilarProducts } from "@/lib/data/similar-products";
import type {
  Product,
  ProductDetail,
  ProductAnalysis,
  RedFlag,
} from "@/lib/types/product";

/**
 * UI data-access seam (AGENTS.md section 5: UI displays stored data only).
 *
 * Server-side reads compose the Supabase data layer directly (no HTTP
 * round-trip to the app's own routes — a relative fetch URL cannot be parsed
 * during server rendering). The thin `/api/products` GET routes delegate to
 * these same functions for any client-side callers.
 */

/** Home-grid products: analyzed only, newest first, with trust score. */
export async function getProducts(): Promise<Product[]> {
  const rows = await listAnalyzedProducts();
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    reviewCount: r.review_count,
    trustScore: r.trust_score,
    price: r.price,
    sourceName: r.source_name ?? undefined,
    analyzedAt: r.analyzed_at,
  }));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Keep only well-formed { type, description } entries from AI-generated jsonb. */
function normalizeRedFlags(value: unknown): RedFlag[] {
  if (!Array.isArray(value)) return [];
  const flags: RedFlag[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const { type, description } = item as Record<string, unknown>;
    if (typeof type === "string" && type.length > 0) {
      flags.push({ type, description: typeof description === "string" ? description : "" });
    }
  }
  return flags;
}

/**
 * Product detail: the product, its trust analysis, review count, source name,
 * and pgvector similar products (section 20). Returns null for unknown,
 * malformed, or not-yet-analyzed products — the UI maps that to not-found.
 */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const product = await getProductById(id);
  if (!product) return null;

  const analysisRow = await getAnalysisByProduct(id);
  if (!analysisRow) return null;

  const [counts, source, similarRows] = await Promise.all([
    countReviewsByProduct([id]),
    getSourceById(product.source_id),
    findSimilarProducts(id, product.category),
  ]);

  const similarCounts = await countReviewsByProduct(similarRows.map((s) => s.id));
  const similarProducts: Product[] = similarRows.map((s) => ({
    id: s.id,
    title: s.title,
    imageUrl: s.image_url,
    reviewCount: similarCounts.get(s.id) ?? 0,
    trustScore: s.trust_score,
    price: s.price,
  }));

  const analysis: ProductAnalysis = {
    trustLabel: analysisRow.trust_label,
    sentiment: {
      positive: analysisRow.positive_pct,
      neutral: analysisRow.neutral_pct,
      negative: analysisRow.negative_pct,
    },
    fakeReviewPercentage: analysisRow.fake_review_pct,
    authenticityConfidence: analysisRow.authenticity_confidence,
    redFlags: normalizeRedFlags(analysisRow.red_flags),
    neutralSummary: analysisRow.neutral_summary,
    disclaimer: analysisRow.disclaimer ?? undefined,
    modelName: analysisRow.model_name ?? undefined,
  };

  return {
    id: product.id,
    title: product.title,
    imageUrl: product.image_url,
    reviewCount: counts.get(id) ?? 0,
    trustScore: analysisRow.trust_score,
    price: product.price,
    sourceName: source?.name ?? undefined,
    analyzedAt: product.analyzed_at,
    analysis,
    similarProducts,
  };
}
