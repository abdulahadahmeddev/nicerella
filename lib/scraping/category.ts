import "server-only";

/**
 * Category derivation for scraped products (AGENTS.md section 8).
 *
 * Sources are stored as listing/category entry pages, and a source's listing
 * URL is the strongest signal for the category of everything scraped from it.
 * The products table stores that category so the pgvector "similar products"
 * query can be scoped to the same category (section 20) instead of silently
 * matching across the whole catalog.
 *
 * Extraction order:
 *   1. Amazon-style `?k=<keyword>` search param → humanized keyword.
 *   2. `?q=<keyword>` search param (generic stores) → humanized keyword.
 *   3. Listing URL path segment that looks like a category (two+ words).
 *   4. Fallback: source name with "[demo]" / "Amazon (" style prefixes trimmed.
 */

/** Turn `wireless+headphones` / `wireless%20headphones` → `Wireless Headphones`. */
function humanizeKeyword(raw: string): string {
  const words = raw
    .replace(/\+/g, " ")
    .replace(/%20/g, " ")
    .replace(/[-_]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function searchKeywordFromUrl(listingUrl: string): string {
  try {
    const parsed = new URL(listingUrl);
    const kw = parsed.searchParams.get("k") || parsed.searchParams.get("q");
    if (kw) return humanizeKeyword(kw);
  } catch {
    // malformed URL — fall through to path-based heuristics
  }
  return "";
}

function categoryFromPath(listingUrl: string): string {
  try {
    const parsed = new URL(listingUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = humanizeKeyword(segments[i]);
      // A category segment is usually multi-word (or a known category word);
      // skip generic single-word segments that are almost always a store
      // root (`shop`, `products`, `search`, ...).
      const generic = /^(products?|items?|shop|search|category|catalog|all|home)$/i;
      if (seg.length > 1 && !generic.test(seg)) return seg;
    }
  } catch {
    // fall through to source-name fallback
  }
  return "";
}

/** Best-effort category for a source's products. Never throws. */
export function deriveCategory(
  listingUrl: string,
  sourceName: string,
): string | null {
  const fromSearch = searchKeywordFromUrl(listingUrl);
  if (fromSearch) return fromSearch;

  const fromPath = categoryFromPath(listingUrl);
  if (fromPath) return fromPath;

  // Source-name fallback: "[demo] Amazon (wireless headphones)" → trim the
  // "[demo]" tag and the brand prefix, keep "Wireless Headphones".
  const name = sourceName
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/^.*\(\s*/, "")
    .replace(/\)\s*$/, "")
    .trim();
  if (name) return humanizeKeyword(name);
  return null;
}
