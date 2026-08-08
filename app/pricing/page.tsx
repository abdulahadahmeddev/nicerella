import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { PricingGrid } from "@/components/billing/pricing-grid";
import { ShieldCheckIcon, CheckIcon } from "@/components/ui/icons";
import { getUserPlan } from "@/lib/data/subscriptions";
import { stripeConfigured } from "@/lib/stripe/env";

export const metadata: Metadata = {
  title: "Pricing — Nicerella",
  description:
    "Free trust scores for every shopper. Upgrade to Pro for unlimited detailed analyses, sentiment breakdowns, and red-flag reports. 14-day free trial, no credit card required.",
};

const FAQS = [
  {
    q: "Is there really a free trial without a credit card?",
    a: "Yes. Pro starts with a 14-day free trial and Stripe does not collect a card during checkout. Cancel anytime before the trial ends and you are never charged.",
  },
  {
    q: "What counts as a detailed trust analysis?",
    a: "Every product gets a trust score on the home grid for free. Detailed analyses add the sentiment breakdown, estimated fake-review percentage, red-flag report, and similar-products comparisons.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Manage billing from the pricing page — cancellation takes effect at the end of your billing period and you keep Pro access until then.",
  },
];

interface PricingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { success, canceled } = await searchParams;
  const { userId } = await auth();
  const plan = await getUserPlan(userId);

  return (
    <>
      <Header actions={<AuthActions />} />

      <main className="page-container flex-1 py-12 sm:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
            <ShieldCheckIcon size={22} weight="fill" className="text-[var(--color-primary)]" />
          </span>
          <h1 className="text-h1 text-[var(--color-foreground)]">
            Honest trust scores,{" "}
            <span className="text-[var(--color-primary-hover)]">fair pricing</span>
          </h1>
          <p className="text-body mx-auto mt-4 max-w-xl text-[var(--color-foreground-muted)]">
            Start free. Upgrade when you want unlimited analyses, full sentiment
            breakdowns, and red-flag reports on every product you shop.
          </p>
        </section>

        {/* Success / canceled banners */}
        {success ? (
          <div className="mx-auto mt-10 max-w-xl rounded-[var(--radius-lg)] border border-[var(--trust-high)] bg-[var(--trust-high)]/10 p-4 text-body-sm text-[var(--color-foreground)]">
            <span className="font-medium text-[var(--trust-high)]">Welcome to Pro!</span>{" "}
            Your subscription is active — enjoy unlimited trust analyses.
          </div>
        ) : null}
        {canceled ? (
          <div className="mx-auto mt-10 max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-body-sm text-[var(--color-foreground-muted)]">
            Checkout canceled. No charges were made — you are still on the Free plan.
          </div>
        ) : null}

        <section className="mt-12">
          <PricingGrid
            currentPlan={plan.plan}
            hasPro={plan.isPro}
            stripeConfigured={stripeConfigured()}
          />
        </section>

        {/* What's included strip */}
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-h3 text-center text-[var(--color-foreground)]">
            Every plan includes
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              "AI fake-review detection",
              "Source-transparent scoring",
              "Daily refreshed analyses",
            ].map((item) => (
              <div
                key={item}
                className="card flex items-start gap-2 p-4 text-body-sm text-[var(--color-foreground)]"
              >
                <CheckIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-h3 text-center text-[var(--color-foreground)]">Questions</h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="card p-5">
                <h3 className="text-body font-medium text-[var(--color-foreground)]">{faq.q}</h3>
                <p className="text-body-sm mt-2 text-[var(--color-foreground-muted)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
