import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { createCheckoutSession } from "@/lib/stripe/server";
import { stripeConfigured } from "@/lib/stripe/env";
import { getPlan, type BillingInterval, type PlanId } from "@/lib/stripe/plans";
import { isSameSiteRequest } from "@/lib/api/origin";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";

/**
 * Start a Stripe Checkout Session (POST, Clerk-authenticated). Body:
 * `{ plan: "pro" | "enterprise", interval: "monthly" | "yearly", trial?: boolean }`.
 *
 * Requires a signed-in user. Returns `{ url }`; the client redirects there.
 * When Stripe is not configured, returns a clear 503 so the UI can show a
 * friendly state instead of crashing.
 */
export const dynamic = "force-dynamic";

const PLAN_IDS = new Set<PlanId>(["free", "pro", "enterprise"]);
const INTERVALS = new Set<BillingInterval>(["monthly", "yearly"]);

export async function POST(request: Request): Promise<Response> {
  // Reject cross-site forgeries first (cheap 403, does not consume the
  // rate-limit budget), then throttle same-site session creation.
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rateLimitResponse = guardRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized — sign in to continue" }, { status: 401 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Add STRIPE_SECRET_KEY to .env.local (Stripe test keys are free) and restart the dev server.",
      },
      { status: 503 },
    );
  }

  let body: { plan?: string; interval?: string; trial?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan as PlanId;
  const interval = (body.interval ?? "monthly") as BillingInterval;
  if (!PLAN_IDS.has(plan) || !INTERVALS.has(interval)) {
    return NextResponse.json({ error: "Invalid plan or interval" }, { status: 400 });
  }
  if (plan === "free") {
    return NextResponse.json(
      { error: "The free plan does not use checkout" },
      { status: 400 },
    );
  }

  // Validate plan exists in the catalog (throws if catalog drift).
  getPlan(plan);

  const user = await currentUser();
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const trial = body.trial ?? true;

  try {
    const { url } = await createCheckoutSession({
      userId,
      email: user?.emailAddresses[0]?.emailAddress ?? null,
      plan,
      interval,
      trial,
      origin,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Log the detail server-side; keep the client response generic so Stripe
    // internals never leak to the browser.
    await writeLog("error", "api/stripe/checkout", "checkout session creation failed", {
      message,
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Checkout failed. Please try again."
            : `Checkout failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
