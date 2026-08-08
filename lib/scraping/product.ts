import "server-only";

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import { isNonProductUrl, normalizeProductUrl } from "./urls";
import { cleanReviewText } from "./cleanup";

/**
 * Generic product-detail page parsing (AGENTS.md sections 12/13). This is the
 * default `universal` parser: it reads common semantic markup (og: tags,
 * itemprop, well-known classes) rather than any one site's DOM. It must pass
 * the product content gate — real title, image URL, and at least one
 * extractable review — before a product is saved.
 */

export interface ParsedProduct {
  title: string;
  imageUrl: string;
  price: number | null;
  canonicalUrl: string;
  reviews: ParsedReview[];
}

export interface ParsedReview {
  identifier: string | null;
  rating: number | null;
  rawText: string;
  reviewDate: string | null;
  verifiedPurchase: boolean;
}

const META_TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  "meta[name=title]",
];
const META_IMAGE_SELECTORS = [
  'meta[property="og:image"]',
  'meta[property="og:image:secure_url"]',
  'meta[name="twitter:image"]',
];
const META_URL_SELECTORS = ['link[rel="canonical"]', 'meta[property="og:url"]'];
const META_PRICE_SELECTORS = [
  'meta[itemprop="price"]',
  'meta[property="product:price:amount"]',
  'meta[property="og:price:amount"]',
];

/** Parse a scraped product detail page into its title/image/price/reviews. */
export function parseProductPage(html: string, fallbackUrl: string): ParsedProduct {
  const $ = cheerio.load(html);

  const title = firstAttr($, META_TITLE_SELECTORS, "content") ?? firstText($, "h1") ?? "";
  const imageUrl = firstAttr($, META_IMAGE_SELECTORS, "content") ?? firstImgSrc($) ?? "";
  const canonicalUrl =
    firstAttr($, META_URL_SELECTORS, "href") ??
    firstAttr($, META_URL_SELECTORS, "content") ??
    fallbackUrl;
  const price = parsePrice($);
  const reviews = extractReviews($);

  return {
    title: title.trim(),
    imageUrl: imageUrl.trim(),
    price,
    canonicalUrl: normalizeProductUrl(canonicalUrl),
    reviews,
  };
}

/** Content gate (section 13): real title, image URL, ≥1 extractable review. */
export function passesContentGate(product: ParsedProduct): boolean {
  if (isGenericTitle(product.title)) return false;
  if (!product.imageUrl || !/^https?:\/\//i.test(product.imageUrl)) return false;
  if (product.reviews.length === 0) return false;
  if (isNonProductUrl(product.canonicalUrl)) return false;
  return true;
}

/** A title is "generic" if it is empty, category-like, or navigation-like. */
function isGenericTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  if (t.length < 3) return true;
  const genericPatterns = [
    /^(home|store|shop|category|search|cart|wishlist|account|checkout|blog|news|help|contact|about|privacy|terms|products?|items?)$/,
    /(?:category|collection|listing|search results?|all products?|new arrivals?|on sale)$/,
  ];
  return genericPatterns.some((re) => re.test(t));
}

function firstAttr(
  $: cheerio.CheerioAPI,
  selectors: string[],
  attr: string,
): string | null {
  for (const selector of selectors) {
    const value = $(selector).first().attr(attr)?.trim();
    if (value) return value;
  }
  return null;
}

function firstText($: cheerio.CheerioAPI, selector: string): string | null {
  const value = $(selector).first().text().trim();
  return value || null;
}

function firstImgSrc($: cheerio.CheerioAPI): string | null {
  let best: string | null = null;
  $("img").each((_index, el) => {
    const src =
      $(el).attr("src") ??
      $(el).attr("data-src") ??
      ($(el).attr("srcset") ?? "").split(" ")[0];
    if (!src || src.length < 10) return;
    if (!best || src.length > best.length) best = src;
  });
  return best;
}

function parsePrice($: cheerio.CheerioAPI): number | null {
  for (const selector of META_PRICE_SELECTORS) {
    const value = $(selector).first().attr("content");
    const parsed = parsePriceString(value);
    if (parsed !== null) return parsed;
  }

  const priceText = $(
    '[itemprop="price"], .price, .product-price, [data-price], span.a-price .a-offscreen',
  )
    .first()
    .text()
    .trim();
  return parsePriceString(priceText);
}

/** Parse a price like "$12.99", "12,99 €", "12.99 USD", or "1.299,00". */
function parsePriceString(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "").replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;

  const withDot = cleaned.includes(".");
  const withComma = cleaned.includes(",");
  let normalized: string;

  if (withDot && withComma) {
    // Last separator is the decimal one: 1.299,00 -> 1299.00; 12.99 -> 12.99.
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const sep = lastDot > lastComma ? "." : ",";
    if (sep === ".") normalized = cleaned.replace(/\./g, "").replace(",", ".");
    else normalized = cleaned.replace(/,/g, "").replace(".", ",");
  } else if (withComma) {
    // "12,99" -> 12.99 (no thousands grouping present)
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractReviews($: cheerio.CheerioAPI): ParsedReview[] {
  const reviews: ParsedReview[] = [];

  // Primary selector: itemprop="review" blocks (schema.org), the most
  // reliable cross-site marker, plus Amazon's `data-hook="review"` blocks
  // (Amazon product pages render these, not itemprop).
  $(
    '[itemprop="review"], .review, .reviews__item, [data-review-id], [data-hook="review"]',
  ).each((_index, el) => {
    const block = $(el);
    const rating = parseRating(block);
    const rawText =
      block.find('[itemprop="reviewBody"]').first().text() ||
      block.find(".review-text, .review-body, .review-content").first().text() ||
      block.text();
    const text = cleanReviewText(rawText);
    if (!text) return;

    const identifier =
      block.attr("data-review-id") ??
      block.attr("id") ??
      block.find('[itemprop="review"]').attr("id") ??
      null;

    const reviewDate =
      block.find('[itemprop="datePublished"]').first().attr("datetime") ??
      block.find("time").first().attr("datetime") ??
      null;

    const verified =
      /verified\s+purchase|verified\s+buyer|confirmed\s+purchase/i.test(block.text());

    reviews.push({
      identifier: identifier ? String(identifier).slice(0, 120) : null,
      rating,
      rawText: text.slice(0, 4000),
      reviewDate,
      verifiedPurchase: verified,
    });
  });

  return reviews.slice(0, 50);
}

/** Rating from common markup: itemprop ratingValue, star aria-labels, x/5. */
function parseRating(block: cheerio.Cheerio<AnyNode>): number | null {
  const explicit = block.find('[itemprop="ratingValue"], [data-rating]').first().attr("content");
  if (explicit) {
    const parsed = Number(explicit);
    if (Number.isFinite(parsed)) return normalizeRating(parsed);
  }

  const starEl = block
    .find('[aria-label*="star"], [aria-label*="Star"], [class*="star"], .a-icon-alt')
    .first();
  const starLabel = starEl.attr("aria-label") ?? starEl.text();
  if (starLabel) {
    // "4.0 out of 5 stars", "4 out of 5", "Rated 4 stars" (Amazon a-icon-alt,
    // Best Buy sr-only, schema.org ratings).
    const match = /([\d.]+)\s*(?:out\s*of\s*5|out\s*of\s*5\s*stars|\/5|stars?)/i.exec(
      starLabel,
    );
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return normalizeRating(parsed);
    }
  }

  const text = block.text();
  const ratio = /([\d.]+)\s*\/\s*5/.exec(text);
  if (ratio) {
    const parsed = Number(ratio[1]);
    if (Number.isFinite(parsed)) return normalizeRating(parsed);
  }
  return null;
}

/** Clamp to 0–5 and normalize fractional 0–5 values. */
function normalizeRating(value: number): number {
  const clamped = Math.max(0, Math.min(5, value));
  return Math.round(clamped * 10) / 10;
}
