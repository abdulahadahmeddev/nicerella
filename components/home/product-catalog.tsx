"use client";

import { useMemo, useState } from "react";

import { Card3D } from "@/components/ui/3d-card";
import { ProductCard } from "@/components/ui/product-card";
import { SearchBar } from "@/components/ui/search-bar";
import { ShieldCheckIcon } from "@/components/ui/icons";
import type { Product } from "@/lib/types/product";

/**
 * Hero search + product grid as one client island (AGENTS.md section 5: UI
 * displays stored data only). The search filters the server-fetched grid by
 * title/source client-side — no new server logic or pipeline access.
 */
export interface ProductCatalogProps {
  products: Product[];
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.sourceName ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <>
      {/* Hero */}
      <section className="page-container relative pb-16 pt-24 text-center sm:pt-32">
        <h1 className="text-display mx-auto max-w-3xl text-[var(--color-foreground)]">
          Find products you can{" "}
          <span className="text-[var(--color-primary-hover)]">actually trust</span>
        </h1>
        <p className="text-body mx-auto mt-5 max-w-xl text-[var(--color-foreground-muted)]">
          Nicerella uses AI to detect fake, bot-written, and incentivized
          reviews — so every score reflects genuine customer experience.
        </p>
        <div className="mx-auto mt-10 max-w-xl">
          <SearchBar
            size="lg"
            placeholder="Search products by name or brand…"
            onSearch={setQuery}
          />
        </div>
      </section>

      {/* Products */}
      <section className="page-container pb-24">
        {products.length > 0 ? (
          <>
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-h3 text-[var(--color-foreground)]">Analyzed products</h2>
              <span className="text-body-sm text-[var(--color-foreground-muted)]">
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </span>
            </div>
            {filtered.length > 0 ? (
              <div className="product-grid">
                {filtered.map((product) => (
                  <Card3D
                    key={product.id}
                    maxTilt={4}
                    glowColor="rgba(124, 58, 237, 0.12)"
                    className="h-full rounded-[var(--radius-lg)]"
                  >
                    <ProductCard product={product} className="h-full" />
                  </Card3D>
                ))}
              </div>
            ) : (
              <div className="card flex flex-col items-center gap-4 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                  <ShieldCheckIcon size={22} weight="fill" className="text-[var(--color-primary)]" />
                </span>
                <h2 className="text-h3 text-[var(--color-foreground)]">No matches</h2>
                <p className="text-body-sm max-w-md text-[var(--color-foreground-muted)]">
                  Nothing matches &ldquo;{query.trim()}&rdquo;. Try a different
                  name or brand.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="card flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
              <ShieldCheckIcon size={22} weight="fill" className="text-[var(--color-primary)]" />
            </span>
            <h2 className="text-h3 text-[var(--color-foreground)]">No analyzed products yet</h2>
            <p className="text-body-sm max-w-md text-[var(--color-foreground-muted)]">
              Once products are scraped and analyzed, their trust scores will
              appear here.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
