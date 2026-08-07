/**
 * Shared product/analysis model types.
 * Field names mirror the Supabase schema in AGENTS.md section 7.
 * UI reads stored data through these types only (section 5).
 */

export interface Product {
  id: string;
  title: string;
  imageUrl: string;
  reviewCount: number;
  /** Trust score 0–1. */
  trustScore: number;
  price?: number | null;
  sourceName?: string;
  analyzedAt?: string | null;
}

export interface SentimentBreakdown {
  /** 0–100; the three values sum to 100. */
  positive: number;
  neutral: number;
  negative: number;
}

export interface RedFlag {
  type: string;
  description: string;
}

export interface ProductAnalysis {
  /** Stored label; derived from trust score when absent. */
  trustLabel?: string;
  sentiment: SentimentBreakdown;
  /** Estimated fake/bot review percentage (0–100). */
  fakeReviewPercentage: number;
  /** Authenticity confidence (0–1). */
  authenticityConfidence: number;
  redFlags: RedFlag[];
  neutralSummary: string;
  disclaimer?: string;
  modelName?: string;
}

export interface ProductDetail extends Product {
  /** null while trust analysis is still in progress. */
  analysis?: ProductAnalysis | null;
  similarProducts: Product[];
}
