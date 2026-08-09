import "server-only";

import { fetchPageHtml, oxylabsSourceTypeForParser } from "@/lib/oxylabs/client";
import { listActiveSources } from "@/lib/data/sources";
import {
  findExistingUrls,
  insertProducts,
  type ProductInsert,
} from "@/lib/data/products";
import { insertReviews, type ReviewInsert } from "@/lib/data/reviews";
import { writeLog } from "@/lib/data/logs";
import type { Json } from "@/lib/supabase/types";
import { extractCandidateUrls } from "@/lib/scraping/listing";
import { deriveCategory } from "@/lib/scraping/category";
import { looksLikeProductUrl, normalizeProductUrl } from "@/lib/scraping/urls";
import { parseProductPage, passesContentGate } from "@/lib/scraping/product";
import {
  emptySummary,
  finalizeSummary,
  type RunSummary,
} from "./run-summary";

/**
 * Shared scrape-to-insert pipeline (AGENTS.md section 9). Both manual scraping
 * (live listing fetch) and scheduler processing (listing HTML from completed
 * job results) run these exact steps; they differ only in how the listing HTML
 * is obtained. Product detail pages are always scraped live through Oxylabs.
 *
 * Every step emits run logging; the returned summary is also what the API
 * routes return to the caller.
 */

export const DEFAULT_LIMIT_PER_SOURCE = 5;

export interface ScrapeOptions {
  source: RunSummary["source"];
  /** Restrict to specific source ids (section 8); empty = all active sources. */
  sourceIds?: string[];
  /** Max valid products saved per source. Default 5. */
  limitPerSource?: number;
  /** Pre-fetched listing HTML keyed by source id (scheduler mode). */
  listingHtmlBySource?: Map<string, string>;
}

export async function runScrapePipeline(
  options: ScrapeOptions,
): Promise<RunSummary> {
  const startedAt = Date.now();
  const summary = emptySummary(options.source);
  const limitPerSource = options.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE;

  await writeLog("info", "pipeline/scrape", "scrape run started", {
    source: options.source,
    limit_per_source: limitPerSource,
    source_ids: options.sourceIds ?? null,
  });

  let activeSources = await listActiveSources();
  if (options.sourceIds && options.sourceIds.length > 0) {
    const wanted = new Set(options.sourceIds);
    activeSources = activeSources.filter((s) => wanted.has(s.id));
  }
  summary.sources_checked = activeSources.length;
  await writeLog("info", "pipeline/scrape", `selected ${activeSources.length} active source(s)`, {
    names: activeSources.map((s) => s.name),
  });

  for (const source of activeSources) {
    await writeLog("info", "pipeline/scrape", `source start: ${source.name}`, {
      source_id: source.id,
      listing_url: source.listing_url,
    });
    try {
      await scrapeOneSource(
        source.id,
        source.listing_url,
        source.name,
        source.parser_strategy,
        limitPerSource,
        options,
        summary,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.source_errors[source.name] = message;
      await writeLog("error", "pipeline/scrape", `source failed: ${source.name}`, {
        source_id: source.id,
        message,
      });
    }
  }

  finalizeSummary(summary, startedAt);
  await writeLog(
    summary.status === "failed" ? "error" : "info",
    "pipeline/scrape",
    "scrape run completed",
    summary as unknown as Json,
  );
  return summary;
}

async function scrapeOneSource(
  sourceId: string,
  listingUrl: string,
  sourceName: string,
  parserStrategy: string | null,
  limitPerSource: number,
  options: ScrapeOptions,
  summary: RunSummary,
): Promise<void> {
  // 1. Listing HTML — scheduler mode uses the completed job's HTML; manual
  //    mode fetches the stored listing URL live through Oxylabs using the
  //    source's parser strategy (section 12).
  const listingSourceType = oxylabsSourceTypeForParser(parserStrategy, true);
  const preFetched = options.listingHtmlBySource?.get(sourceId);
  let listingHtml: string;
  if (preFetched) {
    listingHtml = preFetched;
  } else if (options.listingHtmlBySource) {
    // Scheduler/cron mode with no done-job HTML for this source: skip it.
    // Section 18 says scheduled results must come from Oxylabs job HTML —
    // never fall back to a live listing fetch here (that would silently bill
    // a live scrape for a job that produced nothing).
    const reason = "no scheduled listing HTML";
    summary.source_errors[sourceName] = reason;
    await writeLog("error", "pipeline/scrape", `skipping source: ${sourceName}`, {
      source_id: sourceId,
      reason,
    });
    return;
  } else {
    await writeLog("info", "pipeline/scrape", `fetching listing: ${listingUrl}`, {
      source_id: sourceId,
      source_type: listingSourceType,
    });
    const result = await fetchPageHtml(listingUrl, listingSourceType);
    listingHtml = result.content;
  }

  // 2. Extract visible product-card links only (source-specific for Amazon).
  const candidates = extractCandidateUrls(listingHtml, listingUrl, parserStrategy);
  summary.candidates_found += candidates.length;
  await writeLog("info", "pipeline/scrape", `${candidates.length} candidate link(s) found`, {
    source_id: sourceId,
  });

  // 3. Reject non-product / non-product-shaped URLs before detail scraping.
  const kept: string[] = [];
  for (const url of candidates) {
    if (!looksLikeProductUrl(url)) {
      bumpRejection(summary, "rejected_before_detail");
      continue;
    }
    kept.push(url);
  }
  summary.candidates_rejected += candidates.length - kept.length;

  // 4. Dedupe against the existing catalog.
  const existing = await findExistingUrls(kept);
  const fresh = kept.filter(
    (url) => !existing.has(url) && !existing.has(normalizeProductUrl(url)),
  );
  summary.duplicates_skipped += kept.length - fresh.length;
  await writeLog("info", "pipeline/scrape", `${fresh.length} new product URL(s) after dedupe`, {
    source_id: sourceId,
  });

  // 5. Cap per-source, then scrape detail pages + reviews, validate, insert.
  const toScrape = fresh.slice(0, limitPerSource);
  summary.detail_pages_scraped += toScrape.length;

  for (const url of toScrape) {
    await writeLog("info", "pipeline/scrape", `scraping detail: ${url}`, {
      source_id: sourceId,
    });
    try {
      const detailSourceType = oxylabsSourceTypeForParser(parserStrategy, false);
      const detail = await fetchPageHtml(url, detailSourceType);
      const parsed = parseProductPage(detail.content, url);

      if (!passesContentGate(parsed)) {
        summary.products_rejected += 1;
        bumpRejection(summary, "failed_content_gate");
        await writeLog("warn", "pipeline/scrape", `product rejected (content gate): ${url}`, {
          source_id: sourceId,
          title: parsed.title.slice(0, 120),
        });
        continue;
      }

      const productRow: ProductInsert = {
        source_id: sourceId,
        original_url: url,
        canonical_url: parsed.canonicalUrl || url,
        title: parsed.title,
        image_url: parsed.imageUrl,
        price: parsed.price ?? null,
        category: deriveCategory(listingUrl, sourceName),
      };
      const insertedIds = await insertProducts([productRow]);
      if (insertedIds.length === 0) {
        // Race with another run — the URL already exists. Count as duplicate.
        summary.duplicates_skipped += 1;
        continue;
      }

      const productId = insertedIds[0];
      summary.products_inserted += 1;

      const reviewRows: ReviewInsert[] = parsed.reviews.map((review) => ({
        product_id: productId,
        review_identifier: review.identifier,
        rating: review.rating ?? 0,
        raw_text: review.rawText,
        review_date: review.reviewDate,
        verified_purchase: review.verifiedPurchase || undefined,
      }));
      summary.reviews_inserted += await insertReviews(reviewRows);

      await writeLog("info", "pipeline/scrape", `product inserted: ${parsed.title}`, {
        product_id: productId,
        reviews: reviewRows.length,
      });
    } catch (error) {
      summary.products_failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      await writeLog("error", "pipeline/scrape", `detail scrape failed: ${url}`, {
        source_id: sourceId,
        message,
      });
    }
  }
}

function bumpRejection(summary: RunSummary, reason: string): void {
  summary.rejection_reasons[reason] = (summary.rejection_reasons[reason] ?? 0) + 1;
}
