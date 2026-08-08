/**
 * Stripe environment access (test-mode safe). All values are optional so the
 * app still builds and renders without Stripe configured — the pricing page
 * shows a friendly "unavailable" state and checkout routes return a clear
 * error instead of crashing.
 */

export interface StripeEnv {
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  /** Optional explicit price ids; when set they win over auto-created prices. */
  priceIds: {
    pro: { monthly: string | null; yearly: string | null };
    enterprise: { monthly: string | null; yearly: string | null };
  };
}

export function stripeEnv(): StripeEnv {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? null,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
    priceIds: {
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
      },
      enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? null,
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? null,
      },
    },
  };
}

/** True when the server has a usable Stripe secret key (test or live mode). */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
