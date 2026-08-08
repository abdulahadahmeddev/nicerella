import { Button } from "@/components/ui/button";
import { TrustOrb } from "@/components/ui/trust-orb";
import { MagnifyingGlassIcon } from "@/components/ui/icons";

/**
 * Global 404 page (catch-all route) per not-found.md.
 * Trust orb centered behind at reduced opacity; decorative icon is aria-hidden.
 */
export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <TrustOrb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40" />

      <div className="relative flex max-w-[480px] flex-col items-center text-center">
        <MagnifyingGlassIcon
          size={64}
          weight="duotone"
          className="mb-6 text-[var(--color-foreground-muted)]"
          aria-hidden="true"
        />
        <h1 className="text-h1 mb-4 text-[var(--color-foreground)]">Page not found</h1>
        <p className="text-body mb-8 text-[var(--color-foreground-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Button href="/" size="lg">
          Go Home
        </Button>
      </div>
    </main>
  );
}
