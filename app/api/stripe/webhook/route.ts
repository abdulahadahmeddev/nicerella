import { NextResponse } from "next/server";

import { getStripe, handleStripeEvent } from "@/lib/stripe/server";
import { stripeEnv } from "@/lib/stripe/env";
import { writeLog } from "@/lib/data/logs";
import { captureServerEvent } from "@/lib/posthog/server";

/**
 * Stripe webhook (POST). Source of truth for plan state — Stripe sends
 * `checkout.session.completed` and `customer.subscription.*` events here and
 * we mirror them into the `subscriptions` table.
 *
 * The request body must be the raw payload (used for signature verification),
 * so this route reads `request.text()` before any JSON parsing. Rejects with
 * 400 when the `stripe-signature` header does not verify against
 * STRIPE_WEBHOOK_SECRET.
 */
export const dynamic = "force-dynamic";

/**
 * Read the request body with a hard byte cap so an oversized payload cannot
 * exhaust memory. Stripe webhook bodies are at most a few hundred KB; anything
 * over the cap is rejected before it is fully buffered.
 */
const MAX_WEBHOOK_BYTES = 1_000_000;

async function readBodyLimited(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let payload = "";
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_WEBHOOK_BYTES) throw new Error("payload too large");
    payload += decoder.decode(value, { stream: true });
  }
  return payload;
}

export async function POST(request: Request): Promise<Response> {
  let payload: string;
  try {
    payload = await readBodyLimited(request);
  } catch {
    return NextResponse.json(
      { error: "Request body too large or unreadable" },
      { status: 413 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  const { webhookSecret } = stripeEnv();

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Webhook not configured."
            : "STRIPE_WEBHOOK_SECRET is not configured. Set it in .env.local (run `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally) and restart the dev server.",
      },
      { status: 500 },
    );
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature ?? "", webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeLog("error", "stripe/webhook", `signature verification failed`, {
      message,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    await writeLog("info", "stripe/webhook", `handled ${event.type}`, result);
    // PostHog telemetry for billing lifecycle (fire-and-forget, never blocks).
    captureServerEvent(`stripe_${event.type.replaceAll(".", "_")}`, {
      distinctId: result.userId ?? "unknown",
      plan: result.plan,
      customerId: result.customerId,
      eventType: event.type,
    });
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeLog("error", "stripe/webhook", `failed to handle ${event.type}`, {
      message,
    });
    // Return 500 so Stripe retries the event.
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
