import { Button } from "@/components/ui/button";
import type { UserPlan } from "@/lib/data/subscriptions";

export interface PlanCtaContent {
  title: string;
  description: string;
  button: string;
  href: string;
}

/**
 * Single source of truth for plan-aware CTA copy (articles, gates, etc.).
 * Free / anonymous visitors get the trial pitch; anyone with an active or
 * trialing paid plan gets a confirmation card with a "Manage billing" action.
 */
export function planCtaContent(plan: UserPlan): PlanCtaContent {
  const isEnterprise = plan.plan === "enterprise";

  if (plan.plan === "pro" || plan.plan === "enterprise") {
    if (plan.isTrialing) {
      return {
        title: isEnterprise ? "Enterprise trial active" : "Your Pro trial is active",
        description: isEnterprise
          ? "Custom sources and dedicated support are unlocked while your trial runs."
          : "Enjoy unlimited trust analyses, full sentiment breakdowns, and red-flag reports while your 14-day trial lasts.",
        button: "Manage billing",
        href: "/pricing",
      };
    }
    return {
      title: isEnterprise ? "You're on Enterprise" : "You're on Pro",
      description: isEnterprise
        ? "Custom sources, API access, and dedicated support are unlocked on your plan."
        : "Enjoy unlimited trust analyses and full sentiment breakdowns on every product you shop.",
      button: "Manage billing",
      href: "/pricing",
    };
  }

  return {
    title: "Check any product with an AI trust score",
    description:
      "Free trust scores for every shopper. Upgrade for the full sentiment breakdown and red-flag report.",
    button: "Start 14-day free trial",
    href: "/pricing",
  };
}

interface PlanCtaProps {
  plan: UserPlan;
}

/**
 * Plan-aware upgrade card shown at the bottom of editorial content. Renders
 * on the server from the signed-in user's plan (anonymous visitors always see
 * the Free pitch via getUserPlan(null)).
 */
export function PlanCta({ plan }: PlanCtaProps) {
  const content = planCtaContent(plan);

  return (
    <section className="card mt-8 flex flex-col items-center p-8 text-center">
      <h2 className="text-h4 text-[var(--color-foreground)]">{content.title}</h2>
      <p className="text-body-sm mt-2 max-w-md text-[var(--color-foreground-muted)]">
        {content.description}
      </p>
      <div className="mt-5">
        <Button href={content.href} size="lg">
          {content.button}
        </Button>
      </div>
    </section>
  );
}
