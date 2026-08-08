import "server-only";

import { analyzeWithProvider, DEFAULT_DISCLAIMER, type TrustAnalysisOutput } from "@/lib/ai/analysis";
import {
  availableAnalysisProviders,
  type AnalysisProvider,
} from "@/lib/ai/providers";
import { hasEmbeddingProvider, embedText } from "@/lib/ai/embed";
import {
  insertTrustAnalysis,
  listPendingAnalysisProducts,
  type PendingAnalysisRow,
} from "@/lib/data/analyses";
import { markAnalyzed } from "@/lib/data/products";
import { listReviewsForAnalysis } from "@/lib/data/reviews-read";
import { writeLog } from "@/lib/data/logs";
import type { Json } from "@/lib/supabase/types";

/**
 * AI trust analysis pipeline (AGENTS.md section 19). Picks up every product
 * still awaiting analysis (analyzed_at is null), runs each through the
 * free-tier provider failover chain (Gemini → Groq → Cerebras → Mistral →
 * HuggingFace), rounds the sentiment percentages to sum to exactly 100 (DB
 * CHECK constraint), stores the 768-dim pgvector embedding alongside the
 * analysis, and marks the product analyzed.
 *
 * Shared by the manual `POST /api/analyze` route and step two of the cron
 * pipeline, so it emits the same run logging either way.
 */

/** Cap on products analyzed per run — bounded so a manual run stays fast. */
export const DEFAULT_ANALYSIS_LIMIT = 100;

export interface AnalysisSummary {
  status: "completed" | "partial" | "failed";
  products_pending: number;
  products_analyzed: number;
  products_failed: number;
  products_skipped_no_reviews: number;
  providers_used: string[];
  embeddings_skipped: number;
  duration_ms: number;
}

export interface AnalyzeOptions {
  /** Max products to analyze this run. Default 100. */
  limit?: number;
}

export async function runAnalysisPipeline(
  options: AnalyzeOptions = {},
): Promise<AnalysisSummary> {
  const startedAt = Date.now();
  const providers = availableAnalysisProviders();

  await writeLog("info", "pipeline/analyze", "analysis run started", {
    limit: options.limit ?? null,
    providers_configured: providers.map((p) => p.name),
  });

  const summary: AnalysisSummary = {
    status: "completed",
    products_pending: 0,
    products_analyzed: 0,
    products_failed: 0,
    products_skipped_no_reviews: 0,
    providers_used: [],
    embeddings_skipped: 0,
    duration_ms: 0,
  };

  if (providers.length === 0) {
    summary.status = "failed";
    await writeLog("error", "pipeline/analyze", "no AI analysis provider configured", {
      hint: "Set at least one of GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, MISTRAL_API_KEY, or HUGGINGFACE_API_KEY.",
    });
    return summary;
  }

  const pending = await listPendingAnalysisProducts(
    options.limit ?? DEFAULT_ANALYSIS_LIMIT,
  );
  summary.products_pending = pending.length;
  await writeLog("info", "pipeline/analyze", `${pending.length} product(s) pending analysis`, {
    configured_providers: providers.length,
  });

  for (const product of pending) {
    await analyzeOneProduct(product, providers, summary);
  }

  summary.duration_ms = Date.now() - startedAt;
  summary.status =
    summary.products_failed > 0 ? "partial" : "completed";
  await writeLog(
    summary.products_failed > 0 ? "warn" : "info",
    "pipeline/analyze",
    "analysis run completed",
    summary as unknown as Json,
  );
  return summary;
}

async function analyzeOneProduct(
  product: PendingAnalysisRow,
  providers: AnalysisProvider[],
  summary: AnalysisSummary,
): Promise<void> {
  await writeLog("info", "pipeline/analyze", `analyzing: ${product.title}`, {
    product_id: product.id,
  });

  const reviews = await listReviewsForAnalysis(product.id);
  if (reviews.length === 0) {
    summary.products_skipped_no_reviews += 1;
    await writeLog("warn", "pipeline/analyze", `skipped (no reviews): ${product.title}`, {
      product_id: product.id,
    });
    return;
  }

  // Failover: try each configured provider until one returns zod-validated
  // output; a provider that throws is logged and the next one is tried.
  let output: TrustAnalysisOutput | null = null;
  let providerUsed: string | null = null;
  for (const provider of providers) {
    try {
      output = await analyzeWithProvider(provider, product.title, reviews);
      providerUsed = provider.name;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await writeLog("warn", "pipeline/analyze", `provider failed: ${provider.name}`, {
        product_id: product.id,
        message,
      });
    }
  }

  if (!output || !providerUsed) {
    summary.products_failed += 1;
    await writeLog("error", "pipeline/analyze", `analysis failed (all providers): ${product.title}`, {
      product_id: product.id,
      providers_tried: providers.map((p) => p.name),
    });
    return;
  }

  if (!summary.providers_used.includes(providerUsed)) {
    summary.providers_used.push(providerUsed);
  }

  const [positivePct, neutralPct, negativePct] = roundPercentages(
    output.positive_pct,
    output.neutral_pct,
    output.negative_pct,
  );

  // 768-dim pgvector embedding (AGENTS.md section 20). The analysis is saved
  // even when the embedding fails — the embedding degrades, never the trust
  // score (lib/ai/embed.ts).
  let embedding: string | null = null;
  if (hasEmbeddingProvider()) {
    try {
      const text = [product.title, output.neutral_summary].filter(Boolean).join(" ");
      const vector = await embedText(text);
      embedding = `[${vector.join(",")}]`;
    } catch (error) {
      summary.embeddings_skipped += 1;
      const message = error instanceof Error ? error.message : String(error);
      await writeLog("warn", "pipeline/analyze", `embedding skipped: ${product.title}`, {
        product_id: product.id,
        message,
      });
    }
  }

  try {
    await insertTrustAnalysis({
      product_id: product.id,
      trust_score: output.trust_score,
      trust_label: output.trust_label,
      positive_pct: positivePct,
      neutral_pct: neutralPct,
      negative_pct: negativePct,
      fake_review_pct: output.fake_review_pct,
      authenticity_confidence: output.authenticity_confidence,
      red_flags: output.red_flags,
      neutral_summary: output.neutral_summary,
      disclaimer: output.disclaimer ?? DEFAULT_DISCLAIMER,
      model_name: providerUsed,
      embedding,
    });
    await markAnalyzed(product.id);

    summary.products_analyzed += 1;
    await writeLog("info", "pipeline/analyze", `analyzed: ${product.title}`, {
      product_id: product.id,
      provider: providerUsed,
      trust_score: output.trust_score,
      trust_label: output.trust_label,
      embedding_saved: embedding != null,
    });
  } catch (error) {
    summary.products_failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    await writeLog("error", "pipeline/analyze", `insert failed: ${product.title}`, {
      product_id: product.id,
      message,
    });
  }
}

/**
 * Round three sentiment percentages to integers that sum to exactly 100
 * (largest-remainder method), satisfying the DB CHECK constraint
 * `positive_pct + neutral_pct + negative_pct = 100`. Values are normalized
 * first so a provider that over-reports still lands on 100.
 */
function roundPercentages(
  positive: number,
  neutral: number,
  negative: number,
): [number, number, number] {
  let values = [Math.max(0, positive), Math.max(0, neutral), Math.max(0, negative)];
  const total = values[0] + values[1] + values[2];
  if (total > 100) {
    values = values.map((v) => (v / total) * 100);
  }

  const floors = values.map((v) => Math.floor(v));
  let remaining = 100 - floors.reduce((a, b) => a + b, 0);
  const order = values
    .map((v, index) => ({ index, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; remaining > 0; i++) {
    floors[order[i % order.length].index] += 1;
    remaining -= 1;
  }
  return [floors[0], floors[1], floors[2]];
}
