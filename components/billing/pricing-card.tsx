"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { track } from "@/lib/posthog/client";
import {
  displayPrice,
  type BillingInterval,
  type Plan,
} from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: Plan;
  interval: BillingInterval;
  /** True when this is the user's current plan (server-derived). */
  isCurrent: boolean;
  /** True when the user already has Pro access (trial or paid). */
  hasPro: boolean;
  stripeConfigured: boolean;
}

/**
 * One plan card. Paid plans start a Stripe Checkout Session via
 * `POST /api/stripe/checkout` (Clerk-authed). Signed-out visitors are sent to
 * sign-in first; existing Pro users get the Billing Portal instead.
 */
export function PricingCard({
  plan,
  interval,
  isCurrent,
  hasPro,
  stripeConfigured,
}: PricingCardProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/pricing");
      return;
    }
    if (plan.id === "free") {
      router.push("/");
      return;
    }
    if (hasPro) {
      openPortal();
      return;
    }
    track("checkout_started", { plan: plan.id, interval });
    setBusy("checkout");
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, interval, trial: true }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout could not be started.");
        setBusy(null);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Checkout could not be started. Please try again.");
      setBusy(null);
    }
  }

  async function openPortal() {
    track("billing_portal_opened");
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Billing portal is unavailable.");
        setBusy(null);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Billing portal is unavailable. Please try again.");
      setBusy(null);
    }
  }

  const buttonLabel = plan.id === "free" ? "Get started" : hasPro ? "Manage billing" : plan.cta;
  const buttonVariant = plan.highlighted ? "primary" : "secondary";

  return (
    <div
      className={cn(
        "card relative flex h-full flex-col p-6",
        plan.highlighted && "border-[var(--color-primary)] shadow-glow",
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-label text-white">
          Most popular
        </span>
      ) : null}

      <h3 className="text-h4 text-[var(--color-foreground)]">{plan.name}</h3>
      <p className="text-body-sm mt-1 text-[var(--color-foreground-muted)]">{plan.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-h2 text-[var(--color-foreground)]">
          {displayPrice(plan, interval)}
        </span>
        {plan.monthly > 0 ? (
          <span className="text-body-sm text-[var(--color-foreground-muted)]">
            /mo{interval === "yearly" ? ", billed yearly" : ""}
          </span>
        ) : null}
      </div>
      {plan.note ? (
        <p className="text-caption mt-2 text-[var(--color-foreground-muted)]">{plan.note}</p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature.label}
            className={cn(
              "flex items-start gap-2 text-body-sm",
              feature.included
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-foreground-muted)] line-through decoration-[var(--color-border)]",
            )}
          >
            <CheckIcon
              size={16}
              weight="bold"
              className={cn(
                "mt-0.5 shrink-0",
                feature.included ? "text-[var(--color-primary)]" : "text-[var(--color-foreground-muted)]",
              )}
            />
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {!stripeConfigured && plan.monthly > 0 ? (
          <Button variant={buttonVariant} className="w-full" disabled>
            Stripe not configured
          </Button>
        ) : (
          <Button
            variant={buttonVariant}
            className="w-full"
            onClick={startCheckout}
            disabled={busy !== null}
          >
            {busy ? "Working…" : buttonLabel}
          </Button>
        )}
        {isCurrent && plan.monthly === 0 ? (
          <p className="text-caption mt-2 text-center text-[var(--color-foreground-muted)]">
            Your current plan
          </p>
        ) : null}
        {error ? (
          <p className="text-caption mt-2 text-center text-[var(--color-destructive)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
