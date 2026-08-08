import "server-only";

/**
 * Candidate-URL handling for the scrape pipeline (AGENTS.md sections 9/11/12).
 *
 * Contains the single non-product reject list, URL normalization, and the
 * source-specific product-URL heuristics. All logic here is pure — no I/O —
 * so it can be unit-tested in isolation.
 */

/**
 * Non-product reject list (AGENTS.md section 9). A URL is rejected when its
 * path matches any of these markers — category/filter/sort/search/storefront/
 * bundle/blog/nav pages are never product pages.
 */
const NON_PRODUCT_PATTERNS: RegExp[] = [
  // category roots, filter/sort, and search result pages
  /\/category(?:\/|$)/i,
  /\/collections(?:\/|$)/i,
  /\/search(?:\/|$)/i,
  /[?&](?:q|query|keywords?)=/i,
  /\/s\?k=/i,
  /\/find\.(?:php|html)/i,
  /\/browse(?:\/|$)/i,
  // pagination and sort
  /[?&](?:page|page_size|sort|order|offset|limit)=/i,
  // seller storefront / brand landing pages
  /\/stores\//i,
  /\/storefront(?:\/|$)/i,
  /\/brands?\//i,
  /\/vendors?\//i,
  // out-of-stock placeholders / discontinued
  /\/product-listing\//i,
  /\/discontinued(?:\/|$)/i,
  // offer aggregation / multi-listing pages (e.g. Amazon "new & used" /gp/offer-listing)
  /\/offer-listing(?:\/|$)/i,
  // bundle/collection pages with no single clear product
  /\/bundle(?:\/|$)/i,
  /\/sets(?:\/|$)/i,
  /\/kits(?:\/|$)/i,
  // sponsored/ad placements
  /\/sponsored(?:\/|$)/i,
  /\/ad\//i,
  // navigation / menu / footer / account / misc functional
  /\/account(?:\/|$)/i,
  /\/login(?:\/|$)/i,
  /\/cart(?:\/|$)/i,
  /\/checkout(?:\/|$)/i,
  /\/wishlist(?:\/|$)/i,
  /\/help(?:\/|$)/i,
  /\/support(?:\/|$)/i,
  /\/faq(?:\/|$)/i,
  /\/contact(?:\/|$)/i,
  /\/about(?:\/|$)/i,
  /\/privacy(?:\/|$)/i,
  /\/terms(?:\/|$)/i,
  // blog / guide / editorial
  /\/blog(?:\/|$)/i,
  /\/guides?(?:\/|$)/i,
  /\/news(?:\/|$)/i,
  /\/articles?\//i,
  /\/journal(?:\/|$)/i,
  // video-only pages
  /\/video(?:\/|$)/i,
  // email / share / generic action links
  /mailto:/i,
  /javascript:/i,
  /\/share(?:\/|$)/i,
];

/** Protocols / fragments never resolvable to a product page. */
const IGNORED_PREFIXES = new Set(["mailto:", "tel:", "javascript:", "#", "data:"]);

/**
 * Tracking / search-context query params stripped from candidate URLs before
 * dedupe and before the non-product check. Amazon product-card links on a
 * `/s?k=...` listing carry the search context (`keywords=`, `qid=`, `sr=`,
 * `pd_rd_*`, `dib=`, `dib_tag=`) — those params are residue, not evidence that
 * the URL is a search page; the `/dp/ASIN` path is the real signal.
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ref",
  "ref_",
  "spm",
  "scm",
  "pid",
  "mkt_tok",
  // Amazon search-context residue on product-card links
  "k",
  "keywords",
  "qid",
  "sr",
  "pd_rd_w",
  "pd_rd_r",
  "pd_rd_wg",
  "pd_rd_i",
  "pd_rd_wl",
  "content-id",
  "pf_rd_p",
  "pf_rd_r",
  "pf_rd_s",
  "dib",
  "dib_tag",
  "th",
  "psc",
  "ie",
  "language",
]);

/** True for any URL that should never become a product (sections 9/11). */
export function isNonProductUrl(rawUrl: string): boolean {
  const url = rawUrl.toLowerCase();
  for (const pattern of NON_PRODUCT_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

/** Resolve a possibly-relative href against the page URL; null if unusable. */
export function resolveCandidateUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  for (const prefix of IGNORED_PREFIXES) {
    if (lower.startsWith(prefix)) return null;
  }
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Strip tracking params and fragment, collapse trailing slash, and drop a
 * trailing `/ref=...` path segment (Amazon search-card links are
 * `/slug/dp/ASIN/ref=sr_1_1` — the ref position differs across runs, so it is
 * removed so the same product dedupes).
 */
export function normalizeProductUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  url.pathname = url.pathname.replace(/\/ref=[^/]+$/, "");
  const href = url.href;
  return href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
}

/**
 * Source-specific product-URL heuristic (section 12). A candidate should be
 * kept only when it clearly looks like a single product detail page. When
 * uncertain, reject (stricter choice per section 12).
 */
export function looksLikeProductUrl(rawUrl: string): boolean {
  if (isNonProductUrl(rawUrl)) return false;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  const path = url.pathname;

  // A product detail URL has meaningful path segments, not a bare domain.
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return false;

  const last = segments[segments.length - 1];

  // Heuristic markers that strongly indicate a product page.
  const productMarkers = [
    /^[a-z0-9]{10,}$/i, // long slug / bare id tail
    /\b(?:dp|gp|product|p-?product|item|itm|it\b|sku|sku_id|variant|asin)\b/i,
    /-p-\d+$/i,
    /-sku\d+$/i,
    /-\d{5,}$/,
  ];
  const hasMarker = productMarkers.some((re) => re.test(last) || re.test(path));

  // A path with ≥2 segments and no listing marker is usually a product.
  const hasRealPath = segments.length >= 2 && last.length >= 3;

  return hasMarker || hasRealPath;
}
