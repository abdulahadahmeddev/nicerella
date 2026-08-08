/**
 * Shared data-layer utilities.
 */

/** Default page size for list reads. */
export const DEFAULT_LIST_LIMIT = 100;

/**
 * AGENTS.md section 9 — never pass more than 15 URLs to a single `.in()`
 * filter when checking which candidate URLs already exist in Supabase.
 */
export const URL_CHECK_CHUNK_SIZE = 15;

/**
 * Unwraps a supabase-js query result, throwing a descriptive error when the
 * query fails or returns nothing. Prevents silent failures in the data layer.
 */
export function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string,
): T {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  if (result.data == null) {
    throw new Error(`${label}: query returned no data`);
  }
  return result.data;
}
