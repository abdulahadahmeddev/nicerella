import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon } from "@/components/ui/icons";

/**
 * Product-scoped 404 — rendered when a product id doesn't exist.
 */
export default function ProductNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex max-w-[480px] flex-col items-center text-center">
        <MagnifyingGlassIcon
          size={64}
          weight="duotone"
          className="mb-6 text-[var(--color-foreground-muted)]"
          aria-hidden="true"
        />
        <h1 className="text-h1 mb-4 text-[var(--color-foreground)]">Product not found</h1>
        <p className="text-body mb-8 text-[var(--color-foreground-muted)]">
          This product doesn&apos;t exist or hasn&apos;t been analyzed yet.
        </p>
        <Button href="/" size="lg">
          Go Home
        </Button>
      </div>
    </main>
  );
}
