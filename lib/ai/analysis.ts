import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import type { AnalysisProvider } from "./providers";
import type { ReviewForAnalysis } from "@/lib/data/reviews-read";

/**
 * Trust analysis generation (AGENTS.md section 19). Every provider output is
 * validated with the zod schema below before insert; percentages must sum to
 * exactly 100 (rounded programmatically by the pipeline before insert to
 * satisfy the DB CHECK constraint).
 */

export const TRUST_LABELS = [
  "highly trustworthy",
  "mostly trustworthy",
  "mixed",
  "suspicious",
  "likely manipulated",
] as const;

export type TrustLabel = (typeof TRUST_LABELS)[number];

export const trustAnalysisSchema = z.object({
  trust_score: z.number().min(0).max(1),
  trust_label: z.enum(TRUST_LABELS),
  positive_pct: z.number().min(0).max(100),
  neutral_pct: z.number().min(0).max(100),
  negative_pct: z.number().min(0).max(100),
  fake_review_pct: z.number().min(0).max(100),
  authenticity_confidence: z.number().min(0).max(1),
  red_flags: z
    .array(z.object({ type: z.string().min(1), description: z.string() }))
    .default([]),
  neutral_summary: z.string().min(1),
  disclaimer: z.string().optional(),
});

export type TrustAnalysisOutput = z.infer<typeof trustAnalysisSchema>;

export const DEFAULT_DISCLAIMER =
  "This trust score is an AI-generated estimate based on review patterns, not a certified fraud finding.";

const SYSTEM_PROMPT = `You are a consumer-review authenticity analyst. Given a product title and its customer reviews, you detect signs of fake, bot-written, incentivized, or manipulated reviews (review bursts, duplicate phrasing, incentivized-review language, implausible volume, generic filler). You then produce a structured trust assessment.

Rules:
- trust_score is 0-1 derived from authenticity confidence, red-flag count/severity, and estimated fake-review percentage.
- Map trust_score to trust_label:
  * highly trustworthy (>= 0.85, low fake %, no significant red flags)
  * mostly trustworthy (0.65-0.84, minor red flags only)
  * mixed (0.4-0.64, some conflicting signals, moderate fake %)
  * suspicious (0.2-0.39, multiple red flags: review bursts, duplicate phrasing, incentivized language)
  * likely manipulated (< 0.2, strong evidence of coordinated or bot-generated reviews)
- positive_pct/neutral_pct/negative_pct describe the genuine reviewer sentiment distribution and must each be 0-100. They will be normalized to sum to exactly 100, but aim to be accurate.
- fake_review_pct estimates the share of reviews that look fake/bot/incentivized.
- authenticity_confidence is your confidence in the assessment (0-1).
- red_flags: array of {type, description}. Empty array when none are found.
- neutral_summary: a short, balanced summary of genuine reviewer sentiment, naming concrete praise and complaints.
- disclaimer: always state that this is an AI estimate, not a certified fraud finding.`;

/** Build a compact, token-safe review digest for the model. */
function buildReviewDigest(reviews: ReviewForAnalysis[]): string {
  return reviews
    .map((review, index) => {
      const meta = [
        review.rating != null ? `rating ${review.rating}/5` : null,
        review.verified_purchase ? "verified purchase" : null,
        review.review_date ? `date ${review.review_date}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      const body =
        review.raw_text.length > 600
          ? `${review.raw_text.slice(0, 600)}…`
          : review.raw_text;
      return `[${index + 1}]${meta ? ` (${meta})` : ""}: ${body}`;
    })
    .join("\n\n");
}

/**
 * Ask one provider for a validated trust analysis. Throws on transport
 * errors, schema validation failures, or an absent provider — the pipeline
 * treats any throw as "try the next provider".
 */
export async function analyzeWithProvider(
  provider: AnalysisProvider,
  productTitle: string,
  reviews: ReviewForAnalysis[],
): Promise<TrustAnalysisOutput> {
  if (reviews.length === 0) {
    throw new Error("analyzeWithProvider: no reviews to analyze");
  }

  const digest = buildReviewDigest(reviews);
  const prompt = `Product: ${productTitle}\n\nCustomer reviews:\n${digest}`;

  const result = await generateText({
    model: provider.model,
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: trustAnalysisSchema }),
  });

  if (!result.output) {
    throw new Error(`analyzeWithProvider (${provider.name}): empty output`);
  }

  return result.output;
}
