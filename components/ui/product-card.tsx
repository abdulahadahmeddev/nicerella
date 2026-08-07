import Image from "next/image";
import Link from "next/link";
import { ShieldCheckIcon, StarIcon, TrendUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { getTrustConfig, getTrustLabel } from "@/lib/design-tokens";
import type { Product } from "@/lib/types/product";

export interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Product card with trust badge — used in the home grid and similar-products
 * sections. Links to /products/[id].
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const trustLabel = getTrustLabel(product.trustScore);
  const config = getTrustConfig(trustLabel);
  const percent = Math.round(product.trustScore * 100);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden p-0",
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        "transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-md",
        className
      )}
      aria-label={`${product.title} — trust ${config.label}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-elevated)]">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={false}
        />

        {/* Trust badge */}
        <span
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <ShieldCheckIcon size={14} weight="fill" aria-hidden="true" />
          <span className="text-xs font-bold leading-none">{percent}%</span>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-foreground)]">
          {product.title}
        </h3>

        <div className="mt-auto flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-[var(--color-foreground-muted)]">
            <StarIcon size={14} weight="fill" aria-hidden="true" />
            {product.reviewCount} reviews
          </span>

          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: config.color }}>
            <TrendUpIcon size={14} aria-hidden="true" />
            Trust
          </span>
        </div>
      </div>
    </Link>
  );
}
