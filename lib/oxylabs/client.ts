import "server-only";

import { requireEnv } from "@/lib/env";

/**
 * Oxylabs Web Scraper API client (AGENTS.md section 9 / skill `web-scraper-api`).
 *
 * Only three primitives live here:
 *  - a live page fetch through the Realtime endpoint (`POST /v1/queries`) —
 *    used for both listing pages and product detail pages,
 *  - fetching a completed scheduler job's HTML by job id
 *    (`GET /v1/queries/{job_id}`),
 *  - the low-level authenticated fetch shared by both.
 *
 * Credentials are read lazily so importing this module never fails at build
 * time — the error surfaces on first use with a clear message.
 */

const REALTIME_ENDPOINT = "https://realtime.oxylabs.io/v1/queries";
const DATA_ENDPOINT = "https://data.oxylabs.io/v1";

export interface OxylabsResult {
  content: string;
  status_code: number;
  url: string;
}

/**
 * Oxylabs source types used by this app. The `universal` source handles any
 * public URL, but Amazon requires dedicated source types (`amazon_search` for
 * `/s?k=...` listing pages, `amazon_product` for `/dp/ASIN` detail pages) —
 * sending an Amazon URL to `universal` returns HTTP 400 "Provided url is not
 * supported." (AGENTS.md section 12: use the source's parser strategy when the
 * generic source is not enough).
 */
export type OxylabsSourceType = "universal" | "amazon_search" | "amazon_product";

/**
 * Map a source's `parser_strategy` (stored in Supabase) to the Oxylabs source
 * type used for its requests. `null`/unknown strategies fall back to universal.
 */
export function oxylabsSourceTypeForParser(
  parserStrategy: string | null | undefined,
  isListing: boolean,
): OxylabsSourceType {
  if (parserStrategy === "amazon") {
    return isListing ? "amazon_search" : "amazon_product";
  }
  return "universal";
}

/**
 * Build the Realtime-request body for a URL/source type. `parse` is intentionally
 * omitted so `content` comes back as raw rendered HTML — the cheerio parsers in
 * lib/scraping expect HTML, not Oxylabs' structured JSON.
 */
function buildOxylabsRequest(
  url: string,
  sourceType: OxylabsSourceType,
): Record<string, unknown> {
  switch (sourceType) {
    case "amazon_search":
      return {
        source: "amazon_search",
        domain: "com",
        query: extractAmazonSearchQuery(url),
      };
    case "amazon_product":
      return { source: "amazon_product", query: extractAsinFromUrl(url) };
    case "universal":
    default:
      return { source: "universal", url, render: "html" };
  }
}

/**
 * Amazon `/s?k=<terms>` listing URL → the search terms (the `k` param).
 * Exported so scheduler items (section 18) build the same request shape.
 */
export function extractAmazonSearchQuery(url: string): string {
  const query = new URL(url).searchParams.get("k")?.trim();
  if (!query) {
    throw new Error(
      `Cannot extract Amazon search query from "${url}" (expected a /s?k=... URL).`,
    );
  }
  return query;
}

/** Amazon product URL → its 10-char ASIN (covers /dp/ASIN and /gp/product/ASIN). */
function extractAsinFromUrl(url: string): string {
  const match = /\/dp\/([A-Z0-9]{10})/i.exec(url) ?? /\/gp\/product\/([A-Z0-9]{10})/i.exec(url);
  if (!match) {
    throw new Error(
      `Cannot extract Amazon ASIN from "${url}" (expected a /dp/ASIN URL).`,
    );
  }
  return match[1];
}

function oxyCredentials(): { username: string; password: string } {
  // Shared requireEnv throws with a consistent message when either is missing.
  const username = requireEnv("OXY_WSA_USERNAME");
  const password = requireEnv("OXY_WSA_PASSWORD");
  return { username, password };
}

/** Basic-auth fetch to an Oxylabs endpoint; non-2xx throws with the body. */
export async function oxyFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const { username, password } = oxyCredentials();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Oxylabs ${init?.method ?? "GET"} ${url}: ${res.status} ${body.slice(0, 300)}`);
  }
  return res;
}

/**
 * Live page fetch through the Realtime endpoint (listing or detail page).
 * `sourceType` defaults to `universal`; Amazon sources pass the mapped type
 * (see `oxylabsSourceTypeForParser`).
 */
export async function fetchPageHtml(
  url: string,
  sourceType: OxylabsSourceType = "universal",
): Promise<OxylabsResult> {
  const res = await oxyFetch(REALTIME_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(buildOxylabsRequest(url, sourceType)),
  });
  const payload = (await res.json()) as { results?: OxylabsResult[] };
  const result = payload.results?.[0];
  if (!result) {
    throw new Error(`Oxylabs page fetch returned no results for ${url}`);
  }
  if (result.status_code < 200 || result.status_code >= 300) {
    throw new Error(
      `Oxylabs page fetch for ${url} returned HTTP ${result.status_code}`,
    );
  }
  return result;
}

/**
 * Fetch the HTML of a completed scheduler job result. Scheduler job ids are
 * 64-bit integers; callers must pass the id exactly as read from raw response
 * text (AGENTS.md section 18 — never round-trip through a JS number).
 */
export async function fetchJobHtml(jobId: string): Promise<OxylabsResult> {
  const res = await oxyFetch(`${DATA_ENDPOINT}/queries/${jobId}`);
  const payload = (await res.json()) as { results?: OxylabsResult[] };
  const result = payload.results?.[0];
  if (!result) {
    throw new Error(`Oxylabs job result fetch returned no results for job ${jobId}`);
  }
  if (result.status_code < 200 || result.status_code >= 300) {
    throw new Error(
      `Oxylabs job result for ${jobId} returned HTTP ${result.status_code}`,
    );
  }
  return result;
}
