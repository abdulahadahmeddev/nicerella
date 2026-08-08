import Stripe from "stripe";

import {
  FREE_TRIAL_DAYS,
  PRICE_LOOKUP_KEYS,
  type BillingInterval,
  type PlanId,
} from "./plans";
import { stripeEnv } from "./env";
import {
  downgradeToFree,
  getSubscriptionByUserId,
  upsertSubscription,
} from "@/lib/data/subscriptions";
import { writeLog } from "@/lib/data/logs";

/**
 * Stripe server integration (test-mode safe, no credit card required to build
 * or run — Stripe test keys are free).
 *
 * - Prices resolve from env (STRIPE_PRICE_*), else are auto-created in test
 *   mode with stable `lookup_key`s so the app works with zero dashboard setup.
 * - Checkout supports a no-card free trial via `payment_method_collection:
 *   "if_required"` + `subscription_data.trial_period_days` (Stripe's documented
 *   path for card-free trials).
 * - The webhook (app/api/stripe/webhook) is the source of truth for plan
 *   state; this module maps Stripe events to the `subscriptions` table.
 */

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const { secretKey } = stripeEnv();
  if (!secretKey) {
    throw new Error(
      'Missing required environment variable "STRIPE_SECRET_KEY" (Stripe test key). Add it to .env.local and restart the dev server.',
    );
  }
  cachedStripe = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
  });
  return cachedStripe;
}

/** Display cents for each plan/interval — must match plans.ts display prices. */
const PRICE_CENTS: Record<PlanId, Record<BillingInterval, number>> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 900, yearly: 8400 },
  enterprise: { monthly: 4900, yearly: 49200 },
};

/**
 * Resolve the Stripe Price id for a plan+interval: env override first, then a
 * stable-lookup_key price (found or auto-created in test mode).
 */
export async function getOrCreatePriceId(
  stripe: Stripe,
  plan: PlanId,
  interval: BillingInterval,
): Promise<string> {
  if (plan === "free") throw new Error("Free plan has no Stripe price");

  const env = stripeEnv();
  const envPrice = env.priceIds[plan][interval];
  if (envPrice) return envPrice;

  const lookupKey = PRICE_LOOKUP_KEYS[plan][interval];
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data.length > 0) return existing.data[0].id;

  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: PRICE_CENTS[plan][interval],
    recurring: { interval: interval === "monthly" ? "month" : "year" },
    product_data: {
      name: `Nicerella ${plan === "pro" ? "Pro" : "Enterprise"} (${interval})`,
    },
    lookup_key: lookupKey,
  });
  return price.id;
}

export interface CheckoutOptions {
  userId: string;
  email: string | null;
  plan: PlanId;
  interval: BillingInterval;
  trial?: boolean;
  origin: string;
}

/**
 * Create a Checkout Session for a subscription. Free plan short-circuits (no
 * checkout needed). Free trial uses Stripe's no-card trial flow.
 */
export async function createCheckoutSession(
  options: CheckoutOptions,
): Promise<{ url: string }> {
  if (options.plan === "free") {
    return { url: `${options.origin}/pricing?plan=free` };
  }
  const stripe = getStripe();
  const priceId = await getOrCreatePriceId(stripe, options.plan, options.interval);

  let customerId: string | null = null;
  const existing = await getSubscriptionByUserId(options.userId);
  if (existing?.stripe_customer_id) {
    customerId = existing.stripe_customer_id;
  } else if (options.email) {
    const customer = await stripe.customers.create({
      email: options.email,
      metadata: { userId: options.userId },
    });
    customerId = customer.id;
    await upsertSubscription({
      user_id: options.userId,
      stripe_customer_id: customer.id,
      plan: "free",
      status: "active",
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(customerId ? { customer: customerId } : { customer_email: options.email ?? undefined }),
    subscription_data: {
      trial_period_days: options.trial ? FREE_TRIAL_DAYS : undefined,
      metadata: { userId: options.userId, plan: options.plan },
    },
    // Allow starting a free trial without a payment method (Stripe requires a
    // trial or $0 price for this).
    payment_method_collection: options.trial ? "if_required" : "always",
    allow_promotion_codes: true,
    client_reference_id: options.userId,
    metadata: { userId: options.userId, plan: options.plan },
    success_url: `${options.origin}/pricing?success=1`,
    cancel_url: `${options.origin}/pricing?canceled=1`,
  });

  if (!session.url) throw new Error("Stripe checkout returned no URL");
  return { url: session.url };
}

/** Open the Stripe Billing Portal for an existing customer. */
export async function createPortalSession(
  userId: string,
  origin: string,
): Promise<{ url: string }> {
  const stripe = getStripe();
  const row = await getSubscriptionByUserId(userId);
  if (!row?.stripe_customer_id) {
    throw new Error("No billing account found for this user");
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${origin}/pricing`,
  });
  return { url: session.url };
}

/** Resolve the plan id from Stripe subscription metadata or its price amount. */
function planFromSubscription(subscription: Stripe.Subscription): PlanId {
  const meta = subscription.metadata.plan as PlanId | undefined;
  if (meta === "pro" || meta === "enterprise") return meta;

  const amount = subscription.items.data[0]?.price.unit_amount ?? 0;
  if (amount === PRICE_CENTS.pro.monthly || amount === PRICE_CENTS.pro.yearly) return "pro";
  if (
    amount === PRICE_CENTS.enterprise.monthly ||
    amount === PRICE_CENTS.enterprise.yearly
  ) {
    return "enterprise";
  }
  return "pro";
}

/** Map a Stripe subscription status to our stored status. */
function mapStatus(status: Stripe.Subscription.Status): string {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete_expired" || status === "incomplete") return "incomplete";
  return "active";
}

/** Details propagated to the webhook caller for telemetry. */
export interface SubscriptionDetails {
  userId: string;
  plan: PlanId;
  customerId: string | null;
}

/** Upsert our subscriptions row from a Stripe subscription object. */
export async function applySubscription(
  subscription: Stripe.Subscription,
): Promise<SubscriptionDetails> {
  const userId = subscription.metadata.userId;
  if (!userId) throw new Error("Stripe subscription is missing userId metadata");

  const plan = planFromSubscription(subscription);
  const status = mapStatus(subscription.status);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan,
    status,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    current_period_end: subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
  });
  await writeLog("info", "stripe", `subscription ${status}: ${userId} (${plan})`, {
    stripe_subscription_id: subscription.id,
  });
  return { userId, plan, customerId };
}

export type StripeEventResult = {
  handled: string;
  userId?: string | null;
  plan?: PlanId;
  customerId?: string | null;
};

/** Handle a verified Stripe webhook event and update plan state. */
export async function handleStripeEvent(
  event: Stripe.Event,
): Promise<StripeEventResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.metadata?.userId ?? session.client_reference_id ?? null;
      if (!userId || !session.subscription) {
        await writeLog("warn", "stripe", "checkout.session.completed missing userId/subscription", {
          session_id: session.id,
        });
        return { handled: "ignored", userId };
      }
      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription as string,
      );
      const details = await applySubscription(subscription);
      return { handled: "checkout.session.completed", ...details };
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const details = await applySubscription(subscription);
      return { handled: event.type, ...details };
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      if (userId) {
        await downgradeToFree(userId);
        await writeLog("info", "stripe", `subscription deleted: ${userId}`);
      }
      return { handled: "customer.subscription.deleted", userId, customerId };
    }
    default:
      return { handled: "unhandled" };
  }
}
