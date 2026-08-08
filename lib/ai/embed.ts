import "server-only";

import { embedMany } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Embedding generation (AGENTS.md section 20). OpenAI is not available (no
 * credit-card providers), so embeddings come from Gemini `gemini-embedding-001`
 * (768-dim model output, free) with a provider abstraction so another free
 * embedding provider can be swapped in later.
 *
 * Storage dimension: the deployed pgvector column is `vector(1536)`. Gemini
 * returns 768 dims, which we zero-pad to 1536 before storing. Zero-padding is
 * lossless for cosine similarity (extra zero dims do not change the dot
 * product or either norm), so `<=>` results are identical to the raw 768-dim
 * vectors.
 */

/** Dimension stored in `product_trust_analyses.embedding` (vector(1536)). */
export const EMBEDDING_DIMENSIONS = 1536;
/** Gemini `gemini-embedding-001` output dimension, pinned via providerOptions. */
const EMBEDDING_MODEL_OUTPUT_DIMENSIONS = 768;
const EMBEDDING_MODEL = "gemini-embedding-001";

/** True when the embedding provider is configured. */
export function hasEmbeddingProvider(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Zero-pads a vector to exactly `dim` entries (lossless for cosine). */
function padToDimension(vec: number[], dim: number): number[] {
  if (vec.length === dim) return vec;
  if (vec.length > dim) {
    throw new Error(`padToDimension: ${vec.length} dims exceeds target ${dim}`);
  }
  return [...vec, ...new Array(dim - vec.length).fill(0)];
}

/**
 * Embed a single text value (neutral summary + title + category) as a
 * 1536-dim float vector. Throws a clear error when no embedding provider is
 * configured — callers degrade the stored embedding, never the analysis.
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing required environment variable "GEMINI_API_KEY" for embeddings. Add it to .env.local and restart the dev server.',
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  // `gemini-embedding-001` returns 3072 dims by default; pin the model output
  // to 768, then pad to the stored 1536 (see module docs).
  const { embeddings } = await embedMany({
    model: google.embeddingModel(EMBEDDING_MODEL),
    values: [text],
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_MODEL_OUTPUT_DIMENSIONS },
    },
  });

  const embedding = embeddings[0];
  if (!embedding || embedding.length !== EMBEDDING_MODEL_OUTPUT_DIMENSIONS) {
    throw new Error(
      `embedText: expected a ${EMBEDDING_MODEL_OUTPUT_DIMENSIONS}-dim model embedding, got ${embedding?.length ?? 0}`,
    );
  }
  return padToDimension(embedding, EMBEDDING_DIMENSIONS);
}
