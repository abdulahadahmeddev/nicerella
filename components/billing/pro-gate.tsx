import { Button } from "@/components/ui/button";
import { StarIcon } from "@/components/ui/icons";

interface ProGateProps {
  isPro: boolean;
  /** Optional CTA destination override. */
  href?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Server-side feature gate (AGENTS.md section 5). When the user has Pro access
 * (paid or trialing) it renders the children; otherwise it renders an upgrade
 * card. Because this runs on the server, non-Pro visitors never receive the
 * gated analysis markup — the analysis is not shipped to them.
 */
export function ProGate({
  isPro,
  href = "/pricing",
  title = "Unlock the full analysis",
  description = "Pro gives you the complete sentiment breakdown, red-flag report, and similar-product comparisons.",
  children,
}: ProGateProps) {
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <section className="card relative mt-6 overflow-hidden p-8 text-center">
      <span
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 200px at 50% 0%, rgba(124, 58, 237, 0.25), transparent)",
        }}
        aria-hidden="true"
      />
      <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
        <StarIcon size={22} weight="fill" className="text-[var(--color-primary)]" />
      </span>
      <h3 className="relative mt-4 text-h4 text-[var(--color-foreground)]">{title}</h3>
      <p className="relative mx-auto mt-2 max-w-md text-body-sm text-[var(--color-foreground-muted)]">
        {description}
      </p>
      <div className="relative mt-6">
        <Button href={href} size="lg">
          Start 14-day free trial
        </Button>
        <p className="text-caption mt-3 text-[var(--color-foreground-muted)]">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}
