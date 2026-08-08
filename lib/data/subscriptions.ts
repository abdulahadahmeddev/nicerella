import { createServiceClient } from "@/lib/supabase/client";
import type { PlanId } from "@/lib/stripe/plans";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInput {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan: PlanId;
  status: string;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
}

/** Active/trialing statuses that unlock Pro features. */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function planUnlocksPro(plan: string): boolean {
  return plan === "pro" || plan === "enterprise";
}

/** A subscription grants Pro access when its plan is paid and status is live. */
export function isProSubscription(row: Pick<SubscriptionRow, "plan" | "status">): boolean {
  return planUnlocksPro(row.plan) && ACTIVE_STATUSES.has(row.status);
}

/** Fetch a user's subscription row (null when never subscribed). */
export async function getSubscriptionByUserId(
  userId: string,
): Promise<SubscriptionRow | null> {
  const client = createServiceClient();
  const res = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (res.error) {
    // Table may not exist yet (schema not applied) — treat as no subscription.
    if (res.error.code === "42P01" || res.error.message.includes("permission denied")) {
      return null;
    }
    throw new Error(`getSubscriptionByUserId: ${res.error.message}`);
  }
  return res.data;
}

/** Upsert by user_id — one subscription row per Clerk user. */
export async function upsertSubscription(
  input: SubscriptionInput,
): Promise<SubscriptionRow> {
  const client = createServiceClient();
  const res = await client
    .from("subscriptions")
    .upsert(
      {
        ...input,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (res.error) {
    if (res.error.code === "42P01" || res.error.message.includes("permission denied")) {
      throw new Error("subscriptions table not found — run supabase/schema.sql in Supabase Dashboard SQL Editor");
    }
    throw new Error(`upsertSubscription: ${res.error.message}`);
  }
  return res.data;
}

/** Reset a user to the free plan (subscription ended/canceled). */
export async function downgradeToFree(userId: string): Promise<void> {
  const client = createServiceClient();
  const res = await client
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      stripe_subscription_id: null,
      trial_ends_at: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (res.error) {
    if (res.error.code === "42P01" || res.error.message.includes("permission denied")) {
      throw new Error("subscriptions table not found — run supabase/schema.sql in Supabase Dashboard SQL Editor");
    }
    throw new Error(`downgradeToFree: ${res.error.message}`);
  }
}

export interface UserPlan {
  plan: PlanId;
  status: string;
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
}

/**
 * Feature-gating seam (AGENTS.md section 5): server code calls this to decide
 * whether a signed-in user may see Pro content. Anonymous visitors are free.
 */
export async function getUserPlan(userId: string | null): Promise<UserPlan> {
  if (!userId) {
    return { plan: "free", status: "active", isPro: false, isTrialing: false, trialEndsAt: null };
  }
  const row = await getSubscriptionByUserId(userId);
  if (!row) {
    return { plan: "free", status: "active", isPro: false, isTrialing: false, trialEndsAt: null };
  }
  return {
    plan: (row.plan as PlanId) || "free",
    status: row.status,
    isPro: isProSubscription(row),
    isTrialing: row.status === "trialing",
    trialEndsAt: row.trial_ends_at,
  };
}
