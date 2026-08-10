import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { isAdminRequest } from "@/lib/api/admin-secret";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { PRODUCTS_CACHE_TAG } from "@/lib/api/products";
import { writeLog } from "@/lib/data/logs";
import {
  getSourceById,
  listSources,
  upsertSource,
} from "@/lib/data/sources";
import {
  findExistingUrls,
  insertProducts,
  type ProductInsert,
} from "@/lib/data/products";
import { insertReviews, type ReviewInsert } from "@/lib/data/reviews";
import { runAnalysisPipeline, type AnalysisSummary } from "@/lib/pipeline/analyze";

/**
 * Manual product add (owner-only, AGENTS.md section 7/10).
 *
 * Lets the owner bulk-insert products (and optional reviews) directly —
 * useful once the Oxylabs scrape quota is exhausted, or for products that
 * aren't on any configured source listing page. Products are inserted
 * append-only (deduped by original_url) and, when they carry at least one
 * review, run through the AI trust analysis pipeline so they appear on the
 * home grid with a trust score.
 *
 * Requires the `x-nicerella-admin-secret` header; 401 otherwise. Never callable
 * from browser code. A source is required per product: pass `source_id`, or a
 * matching source is resolved/created by `source_name` (default "Manual").
 * Sources created here are `active: false` so the scrape pipeline never picks
 * them up.
 *
 * Body: `{ products: [...], analyze?: boolean }` — see ManualProductInput.
 */
export const dynamic = "force-dynamic";

const MAX_PRODUCTS_PER_REQUEST = 200;
const MAX_REVIEWS_PER_PRODUCT = 200;

/**
 * Strip Unicode control characters and trim; returns "" when nothing
 * meaningful remains. \p{Control} (u flag) covers  Unicode Cc controls and
 *  U+007F-U+009F without literal control characters in the source.
 */
function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\p{Control}/gu, "").trim();
}

/** Absolute http(s) URL only — rejects javascript:, data:, and relative paths. */
function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

interface ValidatedReview {
  rating: number;
  text: string;
  date: string | null;
  verified_purchase: boolean;
  identifier?: string;
}

interface ValidatedProduct {
  title: string;
  original_url: string;
  canonical_url: string;
  image_url: string;
  price: number | null;
  category: string | null;
  requested_source_id?: string;
  source_name?: string;
  reviews: ValidatedReview[];
}

interface ReadyProduct extends ValidatedProduct {
  /** Resolved (existing or newly created) source id. */
  source_id: string;
}

function validateReview(input: unknown): { value?: ValidatedReview; error?: string } {
  if (typeof input !== "object" || input === null) {
    return { error: "review must be an object" };
  }
  const r = input as {
    rating?: unknown;
    text?: unknown;
    date?: unknown;
    verified_purchase?: unknown;
    identifier?: unknown;
  };
  const rating = Number(r.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { error: "rating must be a number 1-5" };
  }
  const text = sanitizeText(r.text);
  if (!text) return { error: "review text is required" };

  let date: string | null = null;
  if (r.date != null && r.date !== "") {
    const parsed = new Date(r.date as string);
    if (Number.isNaN(parsed.getTime())) return { error: "invalid review date" };
    date = parsed.toISOString();
  }

  const identifier =
    typeof r.identifier === "string" && r.identifier.trim() !== ""
      ? r.identifier.trim()
      : undefined;

  return {
    value: {
      rating,
      text,
      date,
      verified_purchase: Boolean(r.verified_purchase),
      identifier,
    },
  };
}

function validateProduct(input: unknown): { value?: ValidatedProduct; error?: string } {
  if (typeof input !== "object" || input === null) return { error: "product must be an object" };
  const p = input as Record<string, unknown>;

  const title = sanitizeText(p.title);
  if (!title) return { error: "title is required" };
  if (!isValidHttpUrl(p.original_url)) return { error: "invalid original_url" };

  // Canonical defaults to the original URL; anything else must be a valid URL.
  const canonicalUrl =
    typeof p.canonical_url === "string" && p.canonical_url.trim() !== ""
      ? p.canonical_url.trim()
      : (p.original_url as string);
  if (!isValidHttpUrl(canonicalUrl)) return { error: "invalid canonical_url" };
  if (!isValidHttpUrl(p.image_url)) return { error: "invalid image_url" };

  let price: number | null = null;
  if (p.price != null && p.price !== "") {
    price = Number(p.price);
    if (!Number.isFinite(price) || price < 0 || price > 99_999_999) {
      return { error: "invalid price" };
    }
  }

  const reviews: ValidatedReview[] = [];
  if (p.reviews != null) {
    if (!Array.isArray(p.reviews)) return { error: "reviews must be an array" };
    if (p.reviews.length > MAX_REVIEWS_PER_PRODUCT) {
      return { error: `too many reviews (max ${MAX_REVIEWS_PER_PRODUCT})` };
    }
    for (const r of p.reviews) {
      const rr = validateReview(r);
      if (rr.error) return { error: `review error: ${rr.error}` };
      reviews.push(rr.value!);
    }
  }

  return {
    value: {
      title,
      original_url: p.original_url as string,
      canonical_url: canonicalUrl,
      image_url: p.image_url as string,
      price,
      category:
        typeof p.category === "string" && p.category.trim() !== "" ? p.category.trim() : null,
      requested_source_id:
        typeof p.source_id === "string" && p.source_id.trim() !== ""
          ? p.source_id.trim()
          : undefined,
      source_name:
        typeof p.source_name === "string" && p.source_name.trim() !== ""
          ? p.source_name.trim()
          : undefined,
      reviews,
    },
  };
}

/**
 * Resolve a source for a product: use `source_id` when given (must exist),
 * else find/create by name. Created sources are inactive so the scrape
 * pipeline never scrapes them. Errors are returned as strings, not thrown.
 */
async function resolveSourceId(
  sourceId: string | undefined,
  sourceName: string | undefined,
): Promise<{ id: string; error?: string }> {
  if (sourceId) {
    const source = await getSourceById(sourceId);
    if (!source) return { id: "", error: `unknown source_id: ${sourceId}` };
    return { id: source.id };
  }

  const name = (sourceName ?? "Manual").trim();
  if (!name) return { id: "", error: "source_name cannot be empty" };

  const existing = (await listSources()).find(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return { id: existing.id };

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "manual";
  const created = await upsertSource({
    name,
    listing_url: `manual://${slug}`,
    parser_strategy: "manual",
    active: false,
  });
  return { id: created.id };
}

/**
 * Stable dedupe identifier for reviews that don't carry a source id. JSON
 * encoding of [text, rating, date] makes the input unambiguous (no separator
 * collision) and deterministic, so re-posting identical reviews dedupes.
 */
function stableReviewId(r: ValidatedReview): string {
  return createHash("sha256")
    .update(JSON.stringify([r.text, r.rating, r.date]))
    .digest("hex")
    .slice(0, 40);
}

interface ManualProductInput {
  title?: unknown;
  original_url?: unknown;
  canonical_url?: unknown;
  image_url?: unknown;
  price?: unknown;
  category?: unknown;
  source_id?: unknown;
  source_name?: unknown;
  reviews?: unknown;
}

interface AdminProductsBody {
  products: ManualProductInput[];
  analyze?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bounded to limit abuse of a mutating route.
  const rateLimitResponse = guardRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  let body: AdminProductsBody;
  try {
    const parsed = (await request.json()) as AdminProductsBody;
    if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
      return NextResponse.json({ error: "products array is required" }, { status: 400 });
    }
    if (parsed.products.length > MAX_PRODUCTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `too many products (max ${MAX_PRODUCTS_PER_REQUEST} per request)` },
        { status: 400 },
      );
    }
    body = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const analyze = body.analyze !== false;
  const errors: string[] = [];
  const seenUrls = new Set<string>();
  const valid: ValidatedProduct[] = [];

  for (const input of body.products) {
    const result = validateProduct(input);
    if (result.error) {
      const title = sanitizeText((input as Record<string, unknown>)?.title);
      errors.push(`${title ? `"${title}"` : "product"}: ${result.error}`);
      continue;
    }
    const value = result.value!;
    if (seenUrls.has(value.original_url)) {
      errors.push(`duplicate original_url in request: ${value.original_url}`);
      continue;
    }
    seenUrls.add(value.original_url);
    valid.push(value);
  }

  try {
    // Resolve sources (per-product; results cached per source key).
    const sourceCache = new Map<string, string>();
    const ready: ReadyProduct[] = [];
    for (const p of valid) {
      const key = p.requested_source_id ?? `name:${p.source_name ?? "Manual"}`;
      let sourceId = sourceCache.get(key);
      if (!sourceId) {
        const resolved = await resolveSourceId(p.requested_source_id, p.source_name);
        if (resolved.error) {
          errors.push(`"${p.title}": ${resolved.error}`);
          continue;
        }
        sourceId = resolved.id;
        sourceCache.set(key, sourceId);
      }
      ready.push({ ...p, source_id: sourceId });
    }

    // Append-only: skip URLs already stored (dedupe by original_url).
    const existing = await findExistingUrls(ready.map((p) => p.original_url));
    const fresh = ready.filter((p) => !existing.has(p.original_url));
    const skippedDuplicates = ready.length - fresh.length;

    const rows: ProductInsert[] = fresh.map((p) => ({
      source_id: p.source_id,
      original_url: p.original_url,
      canonical_url: p.canonical_url,
      title: p.title,
      image_url: p.image_url,
      price: p.price,
      category: p.category,
    }));
    const insertedIds = await insertProducts(rows);

    // Map inserted ids back to their products (insertProducts preserves order).
    const inserted = insertedIds.map((id, i) => ({ id, product: fresh[i] }));

    // Insert reviews only for newly inserted products, deduped by a stable id.
    const reviewRows: ReviewInsert[] = [];
    for (const { id, product } of inserted) {
      for (const r of product.reviews) {
        reviewRows.push({
          product_id: id,
          review_identifier: r.identifier ?? stableReviewId(r),
          rating: r.rating,
          raw_text: r.text,
          review_date: r.date,
          verified_purchase: r.verified_purchase,
        });
      }
    }
    const reviewsInserted = await insertReviews(reviewRows);

    const productsWithoutReviews = inserted.filter(
      (i) => i.product.reviews.length === 0,
    ).length;

    // Fresh products must show up promptly — bust the products cache.
    if (insertedIds.length > 0) {
      revalidateTag(PRODUCTS_CACHE_TAG, "max");
    }

    // Optional auto-analysis: picks up the newly inserted pending products.
    let analysisSummary: AnalysisSummary | null = null;
    let analysisError: string | null = null;
    if (analyze) {
      try {
        analysisSummary = await runAnalysisPipeline();
        revalidateTag(PRODUCTS_CACHE_TAG, "max");
      } catch (error) {
        analysisError = error instanceof Error ? error.message : String(error);
        await writeLog("error", "api/admin/products", "analysis after manual insert failed", {
          message: analysisError,
        });
      }
    }

    await writeLog("info", "api/admin/products", "manual product insert completed", {
      requested: body.products.length,
      inserted: insertedIds.length,
      skipped_duplicates: skippedDuplicates,
      reviews_inserted: reviewsInserted,
    });

    return NextResponse.json({
      status: "ok",
      requested: body.products.length,
      inserted: insertedIds.length,
      skipped_duplicates: skippedDuplicates,
      reviews_inserted: reviewsInserted,
      products_without_reviews: productsWithoutReviews,
      analyze: analysisSummary,
      analysis_error: analysisError,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeLog("error", "api/admin/products", "manual product insert failed", {
      message,
      errors,
    });
    return NextResponse.json({ error: "Manual product insert failed" }, { status: 500 });
  }
}
