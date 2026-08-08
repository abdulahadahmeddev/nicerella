/**
 * Public plan catalog for the pricing page and feature gating.
 *
 * Display prices live here (client-facing). The actual charge amount always
 * comes from the Stripe Price — either the env-configured price id (preferred,
 * see STRIPE_PRICE_* in .env.example) or a price auto-created in test mode via
 * `getOrCreatePriceId` (lib/stripe/server.ts) so the app works out of the box
 * with free Stripe test keys and no dashboard setup.
 */

export type PlanId = "free" | "pro" | "enterprise";
export type BillingInterval = "monthly" | "yearly";

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in USD (display). */
  monthly: number;
  /** Yearly price in USD (display, per month equivalent). */
  yearly: number;
  yearlyTotal: number;
  cta: string;
  highlighted: boolean;
  /** Features always shown, in order. */
  features: PlanFeature[];
  /** Extra copy shown under the price, e.g. trial info. */
  note?: string;
}

export const FREE_TRIAL_DAYS = 14;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Trust scores for everyone",
    monthly: 0,
    yearly: 0,
    yearlyTotal: 0,
    cta: "Get started",
    highlighted: false,
    features: [
      { label: "Browse analyzed products and trust scores", included: true },
      { label: "5 detailed trust analyses per month", included: true },
      { label: "Review sentiment breakdown", included: false },
      { label: "Similar products & red-flag reports", included: false },
      { label: "Email alerts on new analyses", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious shoppers",
    monthly: 9,
    yearly: 7,
    yearlyTotal: 84,
    cta: "Start free trial",
    highlighted: true,
    note: "14-day free trial. No credit card required.",
    features: [
      { label: "Unlimited detailed trust analyses", included: true },
      { label: "Full review sentiment breakdown", included: true },
      { label: "Similar products & red-flag reports", included: true },
      { label: "Weekly email digests on products you follow", included: true },
      { label: "Early access to new sources", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For teams & researchers",
    monthly: 49,
    yearly: 41,
    yearlyTotal: 492,
    cta: "Contact sales",
    highlighted: false,
    note: "Custom sources, API access, and dedicated support.",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Custom e-commerce sources on request", included: true },
      { label: "Bulk analysis API access", included: true },
      { label: "Dedicated support & SLA", included: true },
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function displayPrice(plan: Plan, interval: BillingInterval): string {
  if (plan.monthly === 0) return "$0";
  if (interval === "monthly") return `$${plan.monthly}`;
  return `$${plan.yearly}`;
}

/**
 * Stable Stripe lookup keys used to find-or-create prices. The app charges
 * exactly these amounts; keep in sync with plans.ts.
 */
export const PRICE_LOOKUP_KEYS: Record<PlanId, Record<BillingInterval, string>> = {
  free: { monthly: "nicerella-free", yearly: "nicerella-free" },
  pro: { monthly: "nicerella-pro-monthly", yearly: "nicerella-pro-yearly" },
  enterprise: {
    monthly: "nicerella-enterprise-monthly",
    yearly: "nicerella-enterprise-yearly",
  },
};
