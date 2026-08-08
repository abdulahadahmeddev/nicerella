import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createPortalSession } from "@/lib/stripe/server";
import { stripeConfigured } from "@/lib/stripe/env";

/**
 * Open the Stripe Billing Portal (POST, Clerk-authenticated) so Pro users can
 * manage payment method, invoices, and cancellation. Returns `{ url }`.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
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
    return NextResponse.json({ error: `Portal failed: ${message}` }, { status: 500 });
  }
}
