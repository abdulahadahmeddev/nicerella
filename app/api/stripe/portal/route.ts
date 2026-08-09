import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createPortalSession } from "@/lib/stripe/server";
import { stripeConfigured } from "@/lib/stripe/env";
import { isSameSiteRequest } from "@/lib/api/origin";
import { guardRateLimit } from "@/lib/api/rate-limit";
import { writeLog } from "@/lib/data/logs";

/**
 * Open the Stripe Billing Portal (POST, Clerk-authenticated) so Pro users can
 * manage payment method, invoices, and cancellation. Returns `{ url }`.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // Reject cross-site forgeries first (cheap 403, does not consume the
  // rate-limit budget), then throttle same-site portal opens.
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rateLimitResponse = guardRateLimit(request, { limit: 20, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet" },
      { status: 503 },
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  try {
    const { url } = await createPortalSession(userId, origin);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Log the detail server-side; keep the client response generic so Stripe
    // internals never leak to the browser.
    await writeLog("error", "api/stripe/portal", "portal session creation failed", {
      message,
    });
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Portal failed. Please try again."
            : `Portal failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
