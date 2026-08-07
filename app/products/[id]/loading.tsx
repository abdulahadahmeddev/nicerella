import { Skeleton } from "@/components/ui/skeleton";

/**
 * Product details loading skeleton — mirrors the details-page layout while the
 * server component resolves the product.
 */
export default function ProductDetailsLoading() {
  return (
    <main className="page-container flex-1 py-8 sm:py-12">
      <Skeleton className="mb-8 h-4 w-48" />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-[var(--radius-2xl)]" />
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </main>
  );
}
