import "server-only";

/**
 * Run summary object emitted by the scrape pipeline and returned by the API
 * (AGENTS.md section 9 "run logging"). The pipeline also writes these numbers
 * to the logs table at the end of each run.
 */

export interface RejectionCounts {
  [reason: string]: number;
}

export interface RunSummary {
  status: "completed" | "partial" | "failed";
  source: "manual" | "scheduled" | "cron";
  sources_checked: number;
  candidates_found: number;
  candidates_rejected: number;
  duplicates_skipped: number;
  detail_pages_scraped: number;
  products_inserted: number;
  reviews_inserted: number;
  products_rejected: number;
  products_failed: number;
  duration_ms: number;
  rejection_reasons: RejectionCounts;
  source_errors: Record<string, string>;
}

export function emptySummary(source: RunSummary["source"]): RunSummary {
  return {
    status: "completed",
    source,
    sources_checked: 0,
    candidates_found: 0,
    candidates_rejected: 0,
    duplicates_skipped: 0,
    detail_pages_scraped: 0,
    products_inserted: 0,
    reviews_inserted: 0,
    products_rejected: 0,
    products_failed: 0,
    duration_ms: 0,
    rejection_reasons: {},
    source_errors: {},
  };
}

/** Finalize a summary with elapsed time and a rolled-up status. */
export function finalizeSummary(summary: RunSummary, startedAt: number): RunSummary {
  summary.duration_ms = Date.now() - startedAt;
  if (Object.keys(summary.source_errors).length > 0 && summary.products_inserted === 0) {
    summary.status = "failed";
  } else if (Object.keys(summary.source_errors).length > 0) {
    summary.status = "partial";
  } else {
    summary.status = "completed";
  }
  return summary;
}
