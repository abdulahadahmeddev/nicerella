import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/data/subscriptions";
import { generateChatResponse, type ChatMessage, type ChatContext } from "@/lib/ai/chat-providers";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatRequestBody {
  messages: ChatMessage[];
  context?: ChatContext;
  sessionId: string;
}

// Rate limiting: track message counts per session (free users only)
const sessionMessageCounts = new Map<string, { count: number; resetAt: number }>();

const FREE_MESSAGE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(sessionId: string, isPro: boolean): { allowed: boolean; remaining: number } {
  if (isPro) {
    return { allowed: true, remaining: -1 }; // Pro = unlimited
  }

  const now = Date.now();
  const record = sessionMessageCounts.get(sessionId);

  if (!record || now > record.resetAt) {
    // New session or expired — reset
    sessionMessageCounts.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: FREE_MESSAGE_LIMIT - 1 };
  }

  if (record.count >= FREE_MESSAGE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: FREE_MESSAGE_LIMIT - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const plan = await getUserPlan(userId);

    const body = (await request.json()) as ChatRequestBody;
    const { messages, context, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(sessionId, plan.isPro);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "You've reached the free message limit. Upgrade to Pro for unlimited chat!",
          upgradeUrl: "/pricing",
        },
        { status: 429 },
      );
    }

    // Generate response
    const { text, provider } = await generateChatResponse(messages, context);

    return NextResponse.json({
      message: text,
      provider,
      remaining: plan.isPro ? -1 : remaining,
    });
  } catch (error) {
    console.error("[chat] API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 },
    );
  }
}
