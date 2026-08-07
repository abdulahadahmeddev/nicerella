import { ProductCardSkeleton } from "@/components/ui/skeleton";

/**
 * Global loading fallback — shows the product-grid skeleton pulse while any
 * server-rendered page suspends (per the home-page loading state in the
 * design system).
 */
export default function Loading() {
  return (
    <main className="page-container flex-1 pb-24 pt-8">
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
