import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/client";

interface SubscribeBody {
  email?: string;
  source?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const email = body.email?.trim().toLowerCase();
    const source = body.source ?? "unknown";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    const { error } = await createServiceClient()
      .from("email_subscribers")
      .upsert(
        { email, source, subscribed_at: new Date().toISOString() },
        { onConflict: "email" },
      );

    if (error) {
      // If the table does not exist yet, return a helpful message instead of crashing
      if (error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error:
              "Newsletter table not set up yet. Run the migration in supabase/migrations/20260811_email_subscribers.sql first.",
          },
          { status: 503 },
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
