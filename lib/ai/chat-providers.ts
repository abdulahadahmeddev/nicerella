import "server-only";
import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Multi-provider AI chat with intelligent failover for Nicerella chat agent.
 * Priority order (fastest → most reliable → fallback):
 * 1. Groq (llama-3.3-70b) — blazing fast, great for chat
 * 2. Gemini (gemini-2.0-flash-exp) — reliable, good reasoning
 * 3. Cerebras (llama-3.3-70b) — fast fallback
 * 4. Mistral (mistral-large-latest) — final fallback
 */

interface ChatProvider {
  name: string;
  model: LanguageModel;
  enabled: boolean;
}

function getChatProviders(): ChatProvider[] {
  const providers: ChatProvider[] = [];

  // Groq — primary (fastest for chat)
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groq = createGroq({ apiKey: groqKey });
      providers.push({
        name: "groq",
        model: groq("llama-3.3-70b-versatile"),
        enabled: true,
      });
    }
  } catch {}

  // Gemini — reliable backup
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      providers.push({
        name: "gemini",
        model: google("gemini-2.0-flash-exp"),
        enabled: true,
      });
    }
  } catch {}

  // Cerebras — fast fallback
  try {
    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    if (cerebrasKey) {
      // Cerebras uses OpenAI-compatible API
      const cerebras = createOpenAI({
        apiKey: cerebrasKey,
        baseURL: "https://api.cerebras.ai/v1",
      });
      providers.push({
        name: "cerebras",
        model: cerebras("llama-3.3-70b"),
        enabled: true,
      });
    }
  } catch {}

  // Mistral — final fallback
  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (mistralKey) {
      const mistral = createMistral({ apiKey: mistralKey });
      providers.push({
        name: "mistral",
        model: mistral("mistral-large-latest"),
        enabled: true,
      });
    }
  } catch {}

  return providers.filter((p) => p.enabled);
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatContext {
  productTitle?: string;
  trustScore?: number;
  trustLabel?: string;
  sentiment?: { positive: number; neutral: number; negative: number };
  redFlags?: string[];
  reviewCount?: number;
  fakePercentage?: number;
}

function buildSystemPrompt(context?: ChatContext): string {
  const basePrompt = `You are Nicerella's AI shopping assistant, built by Abdul Ahad Ahmed. You help users understand product trust scores and make informed purchase decisions.

**Your personality:**
- Friendly, helpful, and conversational (like a knowledgeable friend)
- Data-backed and honest (never oversell, always cite the trust analysis)
- Multilingual — respond in the same language the user writes in (English, Urdu, Roman Urdu, Hindi, etc.)

**Your knowledge:**
- You have access to Nicerella's AI trust analysis (trust scores, sentiment, red flags, fake-review detection)
- You understand e-commerce, product reviews, and shopping decisions
- You can explain trust scores, recommend alternatives, answer product questions, and give shopping advice

**Your style:**
- Keep responses concise (2-4 sentences unless more detail is needed)
- Use casual, friendly tone ("This product looks solid!" not "The product exhibits favorable characteristics")
- When citing data, be specific ("95% trust score, 100% positive sentiment")
- If you don't know something about the product, say so honestly

**Core rules:**
- ALWAYS respond in the user's language (if they write in Urdu/Roman Urdu, reply in Urdu/Roman Urdu)
- Never make up product details — only use the context provided
- If asked about features not in the analysis, suggest checking the product page or reviews directly
- For fake-review questions, explain the red flags (or lack thereof) clearly
- When recommending products, prioritize high trust scores and genuine reviews`;

  if (!context) return basePrompt;

  const contextPrompt = `

**Current product context:**
${context.productTitle ? `- Product: ${context.productTitle}` : ""}
${context.trustScore !== undefined ? `- Trust Score: ${Math.round(context.trustScore * 100)}% (${context.trustLabel})` : ""}
${context.reviewCount ? `- Review Count: ${context.reviewCount}` : ""}
${context.sentiment ? `- Sentiment: ${context.sentiment.positive}% positive, ${context.sentiment.neutral}% neutral, ${context.sentiment.negative}% negative` : ""}
${context.fakePercentage !== undefined ? `- Estimated Fake Reviews: ${context.fakePercentage}%` : ""}
${context.redFlags?.length ? `- Red Flags: ${context.redFlags.join(", ")}` : "- Red Flags: None detected"}

Use this data to answer user questions about THIS product.`;

  return basePrompt + contextPrompt;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context?: ChatContext,
): Promise<{ text: string; provider: string }> {
  const providers = getChatProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI providers configured. Set GROQ_API_KEY, GEMINI_API_KEY, CEREBRAS_API_KEY, or MISTRAL_API_KEY.",
    );
  }

  const systemPrompt = buildSystemPrompt(context);

  // Try each provider in order
  for (const provider of providers) {
    try {
      const result = await generateText({
        model: provider.model,
        instructions: systemPrompt, // Use instructions instead of system messages in messages array
        messages,
        maxOutputTokens: 500, // Keep responses concise
        temperature: 0.7, // Balanced creativity
      });

      return {
        text: result.text,
        provider: provider.name,
      };
    } catch (error) {
      console.error(`[chat] ${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  throw new Error("All AI providers failed. Please try again later.");
}
