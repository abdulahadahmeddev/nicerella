"use client";

import { useState } from "react";

import { PricingCard } from "./pricing-card";
import {
  PLANS,
  type BillingInterval,
  type PlanId,
} from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

interface PricingGridProps {
  currentPlan: PlanId;
  hasPro: boolean;
  stripeConfigured: boolean;
}

/**
 * Client billing grid: monthly/yearly toggle plus one PricingCard per plan.
 * The current plan and Pro status are derived on the server and passed in.
 */
export function PricingGrid({ currentPlan, hasPro, stripeConfigured }: PricingGridProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div>
      {/* Billing interval toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-body-sm",
            interval === "monthly"
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-foreground-muted)]",
          )}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === "yearly"}
          aria-label="Toggle yearly billing"
          onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
          className={cn(
            "relative h-6 w-12 rounded-full border transition-colors",
            interval === "yearly"
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-surface-elevated)]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-foreground)] transition-all",
              interval === "yearly" ? "left-6" : "left-0.5",
            )}
          />
        </button>
        <span
          className={cn(
            "text-body-sm",
            interval === "yearly"
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-foreground-muted)]",
          )}
        >
          Yearly{" "}
          <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-caption text-[var(--color-primary-hover)]">
            Save ~22%
          </span>
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrent={currentPlan === plan.id}
            hasPro={hasPro}
            stripeConfigured={stripeConfigured}
          />
        ))}
      </div>
    </div>
  );
}
