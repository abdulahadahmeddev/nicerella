import "server-only";

import * as cheerio from "cheerio";

import {
  isNonProductUrl,
  looksLikeProductUrl,
  normalizeProductUrl,
  resolveCandidateUrl,
} from "./urls";

/** Maximum candidate product links kept per source listing page. */
export const MAX_CANDIDATES_PER_SOURCE = 200;

/**
 * Extract candidate product URLs from a listing page's HTML (AGENTS.md
 * sections 9/11). Only visible product-card links are collected — anything on
 * the non-product reject list (nav, footer, filters, storefronts, search,
 * editorial, video) is dropped, plus off-domain and non-product-shaped links.
 *
 * For `parser_strategy === "amazon"`, anchors are restricted to the search
 * result cards (`div[data-component-type="s-search-result"]`) — Amazon's search
 * DOM is dense with nav/account/utility links that the generic product-URL
 * heuristic cannot reliably tell apart from real product links (section 11:
 * use a source-specific strategy when generic extraction is not enough).
 *
 * Returns de-duplicated, normalized absolute URLs.
 */
export function extractCandidateUrls(
  html: string,
  baseUrl: string,
  parserStrategy: string | null = null,
): string[] {
  const $ = cheerio.load(html);
  const base = safeUrl(baseUrl);
  if (!base) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  const anchors =
    parserStrategy === "amazon"
      ? $('div[data-component-type="s-search-result"] a[href]')
      : $("a[href]");

  anchors.each((_index, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const resolved = resolveCandidateUrl(href, baseUrl);
    if (!resolved) return;

    // Stay on the listing site — a product link lives on its own domain.
    if (!sameHost(resolved, base.hostname)) return;

    // Normalize first (strip tracking / search-context params like Amazon's
    // `keywords=`) so those params don't trip the non-product search-URL reject
    // list — the product path is the signal, the params are residue.
    const normalized = normalizeProductUrl(resolved);
    if (!normalized) return;

    if (isNonProductUrl(normalized)) return;
    if (!looksLikeProductUrl(normalized)) return;

    // Amazon: the strongest product signal is an ASIN in the path — `/dp/ASIN`
    // or `/gp/product/ASIN`. Requiring it drops promo/storefront/offer links
    // the generic heuristic cannot distinguish (section 12).
    if (
      parserStrategy === "amazon" &&
      !/\/dp\/[A-Z0-9]{10}(?:\/|$)/i.test(normalized) &&
      !/\/gp\/product\/[A-Z0-9]{10}(?:\/|$)/i.test(normalized)
    ) {
      return;
    }

    if (seen.has(normalized)) return;

    seen.add(normalized);
    results.push(normalized);

    if (results.length >= MAX_CANDIDATES_PER_SOURCE) return false;
    return;
  });

  return results;
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function sameHost(url: string, hostname: string): boolean {
  const parsed = safeUrl(url);
  if (!parsed) return false;
  return (
    parsed.hostname === hostname ||
    parsed.hostname.endsWith(`.${hostname}`)
  );
}
