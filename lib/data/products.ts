import { createServiceClient } from "@/lib/supabase/client";
import { countReviewsByProduct } from "./reviews";
import { DEFAULT_LIST_LIMIT, URL_CHECK_CHUNK_SIZE } from "./helpers";

export type ProductRow = {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string;
  title: string;
  image_url: string;
  price: number | null;
  category: string | null;
  first_seen_at: string;
  last_scraped_at: string;
  analyzed_at: string | null;
  created_at: string;
};

export interface ProductInsert {
  source_id: string;
  original_url: string;
  canonical_url: string;
  title: string;
  image_url: string;
  price?: number | null;
  category?: string | null;
}

/** Analyzed product as shown on the home grid. */
export interface AnalyzedProductRow {
  id: string;
  title: string;
  image_url: string;
  price: number | null;
  source_id: string;
  first_seen_at: string;
  analyzed_at: string;
  trust_score: number;
  review_count: number;
  source_name: string | null;
}

/**
 * Home-grid products: analyzed only (analyzed_at set), newest first, each
 * with its trust score, review count, and source name.
 */
export async function listAnalyzedProducts(
  limit: number = DEFAULT_LIST_LIMIT,
): Promise<AnalyzedProductRow[]> {
  const client = createServiceClient();
  const res = await client
    .from("products")
    .select(
      "id, title, image_url, price, source_id, first_seen_at, analyzed_at, sources(name), product_trust_analyses(trust_score)",
    )
    .not("analyzed_at", "is", null)
    .order("first_seen_at", { ascending: false })
    .limit(limit);

  if (res.error) {
    throw new Error(`listAnalyzedProducts: ${res.error.message}`);
  }
  const rows = res.data ?? [];

  const ids = rows.map((r) => r.id);
  const counts = await countReviewsByProduct(ids);

  return rows.map((r) => {
    // PostgREST may return embedded relations as an object (one-to-one /
    // many-to-one) or an array; normalize defensively.
    const sources = r.sources as unknown as { name?: string } | { name?: string }[] | null;
    const pta = r.product_trust_analyses as
      | { trust_score?: number }
      | { trust_score?: number }[]
      | null;
    const sourceName = Array.isArray(sources) ? sources[0]?.name : sources?.name;
    const trustScore = Array.isArray(pta) ? pta[0]?.trust_score : pta?.trust_score;

    return {
      id: r.id,
      title: r.title,
      image_url: r.image_url,
      price: r.price,
      source_id: r.source_id,
      first_seen_at: r.first_seen_at,
      analyzed_at: r.analyzed_at,
      trust_score: trustScore ?? 0,
      review_count: counts.get(r.id) ?? 0,
      source_name: sourceName ?? null,
    };
  });
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const client = createServiceClient();
  const res = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (res.error) {
    throw new Error(`getProductById: ${res.error.message}`);
  }
  return res.data;
}

/**
 * AGENTS.md section 9 — URL existence check for candidate product URLs.
 * Queries in ≤15-URL chunks and matches against both original_url and
 * canonical_url for dedupe.
 */
export async function findExistingUrls(urls: string[]): Promise<Set<string>> {
  const existing = new Set<string>();
  if (urls.length === 0) return existing;

  const client = createServiceClient();
  for (let i = 0; i < urls.length; i += URL_CHECK_CHUNK_SIZE) {
    const chunk = urls.slice(i, i + URL_CHECK_CHUNK_SIZE);
    const [origRes, canonRes] = await Promise.all([
      client.from("products").select("original_url").in("original_url", chunk),
      client.from("products").select("canonical_url").in("canonical_url", chunk),
    ]);
    if (origRes.error) {
      throw new Error(`findExistingUrls: ${origRes.error.message}`);
    }
    if (canonRes.error) {
      throw new Error(`findExistingUrls: ${canonRes.error.message}`);
    }
    for (const row of origRes.data ?? []) existing.add(row.original_url);
    for (const row of canonRes.data ?? []) existing.add(row.canonical_url);
  }
  return existing;
}

/**
 * Append-only product insertion (AGENTS.md section 10). Skips rows that
 * collide on original_url. Callers must pre-filter input through
 * findExistingUrls so canonical_url collisions (and cross-column dupes) are
 * handled before this call. Returns the inserted product ids.
 */
export async function insertProducts(rows: ProductInsert[]): Promise<string[]> {
  if (rows.length === 0) return [];

  const client = createServiceClient();
  const res = await client
    .from("products")
    .upsert(rows, { onConflict: "original_url", ignoreDuplicates: true })
    .select("id");

  if (res.error) {
    throw new Error(`insertProducts: ${res.error.message}`);
  }
  return res.data?.map((r) => r.id) ?? [];
}

/** Bump last_scraped_at after a product detail page is re-scraped. */
export async function touchProductScrape(id: string): Promise<void> {
  const client = createServiceClient();
  const res = await client
    .from("products")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("id", id);
  if (res.error) {
    throw new Error(`touchProductScrape: ${res.error.message}`);
  }
}

/** Mark a product as analyzed (analyzed_at) once its trust analysis is saved. */
export async function markAnalyzed(
  id: string,
  at: string = new Date().toISOString(),
): Promise<void> {
  const client = createServiceClient();
  const res = await client.from("products").update({ analyzed_at: at }).eq("id", id);
  if (res.error) {
    throw new Error(`markAnalyzed: ${res.error.message}`);
  }
}
