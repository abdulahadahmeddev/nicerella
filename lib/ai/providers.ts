import "server-only";

import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createCerebras } from "@ai-sdk/cerebras";
import { createMistral } from "@ai-sdk/mistral";
import { createHuggingFace } from "@ai-sdk/huggingface";

/**
 * Multi-provider free-tier AI registry with failover (AGENTS.md section 19 /
 * implementation prompt). Each provider is gated on its API key being present;
 * the analysis pipeline tries them in this order until one returns valid,
 * zod-validated output. No key configured → the registry is empty and the
 * pipeline fails loudly rather than silently producing nothing.
 *
 * All model ids below are free-tier / no-credit-card providers.
 */

export interface AnalysisProvider {
  name: string;
  model: LanguageModel;
}

export const ANALYSIS_PROVIDER_ORDER = [
  "gemini",
  "groq",
  "cerebras",
  "mistral",
  "huggingface",
] as const;

/** Build the failover registry from whatever free-tier keys are present. */
export function availableAnalysisProviders(): AnalysisProvider[] {
  const providers: AnalysisProvider[] = [];
  const add = (name: string, apiKey: string | undefined, factory: () => LanguageModel) => {
    if (!apiKey) return;
    try {
      providers.push({ name, model: factory() });
    } catch (error) {
      // A misconfigured provider should not take down the whole registry.
      console.error(`[ai/providers] failed to build ${name} provider:`, error);
    }
  };

  add("gemini", process.env.GEMINI_API_KEY, () =>
    createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! }).languageModel("gemini-3.5-flash"),
  );
  add("groq", process.env.GROQ_API_KEY, () =>
    createGroq({ apiKey: process.env.GROQ_API_KEY! }).languageModel("llama-3.3-70b-versatile"),
  );
  add("cerebras", process.env.CEREBRAS_API_KEY, () =>
    createCerebras({ apiKey: process.env.CEREBRAS_API_KEY! }).languageModel("llama3.1-8b"),
  );
  add("mistral", process.env.MISTRAL_API_KEY, () =>
    createMistral({ apiKey: process.env.MISTRAL_API_KEY! }).languageModel("mistral-small-latest"),
  );
  add("huggingface", process.env.HUGGINGFACE_API_KEY, () =>
    createHuggingFace({ apiKey: process.env.HUGGINGFACE_API_KEY! }).languageModel(
      "google/gemma-2-9b-it",
    ),
  );

  return providers;
}
