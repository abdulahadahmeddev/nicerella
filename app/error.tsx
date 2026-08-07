"use client";

import { Button } from "@/components/ui/button";
import { TrustOrb } from "@/components/ui/trust-orb";
import { ShieldWarningIcon } from "@/components/ui/icons";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary per error.md — warning icon, Try Again + Go Home,
 * and a collapsible Error ID (native <details> keeps it accessible and
 * stateless). Trust orb decorates the top-right.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <TrustOrb className="right-0 top-0 opacity-60" />

      <div className="relative flex max-w-[480px] flex-col items-center text-center">
        <ShieldWarningIcon
          size={64}
          weight="duotone"
          className="mb-6 text-[var(--color-destructive)]"
          aria-hidden="true"
        />
        <h1 className="text-h1 mb-4 text-[var(--color-foreground)]">Something went wrong</h1>
        <p className="text-body mb-8 text-[var(--color-foreground-muted)]">
          An unexpected error occurred. Please try again or return to the home page.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button onClick={reset}>Try Again</Button>
          <Button href="/" variant="secondary">
            Go Home
          </Button>
        </div>

        {error.digest ? (
          <details className="mt-8 w-full text-left">
            <summary className="cursor-pointer text-caption text-[var(--color-foreground-muted)]">
              Error ID: {error.digest}
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-[rgba(148,163,184,0.08)] p-2 font-mono text-xs text-[var(--color-foreground-muted)]">
              {error.message}
            </pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}
