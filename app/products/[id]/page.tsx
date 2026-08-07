import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card3D } from "@/components/ui/3d-card";
import { TrustMeter } from "@/components/ui/trust-meter";
import { SentimentChart } from "@/components/ui/sentiment-chart";
import { RedFlagsList } from "@/components/ui/red-flags-list";
import { ProductCard } from "@/components/ui/product-card";
import { TrendUpIcon } from "@/components/ui/icons";
import { getProduct } from "@/lib/api/products";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return {
    title: product ? `${product.title} — Nicerella` : "Product not found — Nicerella",
  };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const analysis = product.analysis;

  return (
    <>
      <Header />

      <main className="page-container flex-1 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: product.title },
          ]}
        />

        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image with subtle 3D tilt */}
          <Card3D
            maxTilt={4}
            glowColor="rgba(124, 58, 237, 0.14)"
            className="rounded-[var(--radius-2xl)]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                className="object-cover"
                priority
              />
            </div>
          </Card3D>

          {/* Title + trust */}
          <div className="space-y-6">
            <div>
              <h1 className="text-h2 text-[var(--color-foreground)]">{product.title}</h1>
              <p className="text-body-sm mt-2 text-[var(--color-foreground-muted)]">
                {product.reviewCount} reviews
                {product.sourceName ? ` · ${product.sourceName}` : ""}
                {product.price != null ? ` · $${product.price.toFixed(2)}` : ""}
              </p>
            </div>

            {analysis ? (
              <TrustMeter
                score={product.trustScore}
                label={analysis.trustLabel}
                fakePercentage={analysis.fakeReviewPercentage}
                confidence={analysis.authenticityConfidence}
              />
            ) : (
              <div className="card flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                  <TrendUpIcon
                    size={22}
                    weight="fill"
                    className="animate-pulse text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                </span>
                <h2 className="text-h4 text-[var(--color-foreground)]">Analysis in progress</h2>
                <p className="text-body-sm max-w-sm text-[var(--color-foreground-muted)]">
                  We're still reviewing the reviews for this product. Check back
                  shortly for its trust score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis breakdown */}
        {analysis && (
          <>
            <section className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="card">
                <h3 className="text-h4 mb-4 text-[var(--color-foreground)]">Review Sentiment</h3>
                <SentimentChart breakdown={analysis.sentiment} />
              </div>
              <RedFlagsList flags={analysis.redFlags} />
            </section>

            <section className="card mt-6">
              <h3 className="text-h4 mb-2 text-[var(--color-foreground)]">
                What reviewers actually say
              </h3>
              <p className="text-body text-[var(--color-foreground-muted)]">
                {analysis.neutralSummary}
              </p>
              {analysis.disclaimer ? (
                <p className="text-caption mt-4 italic text-[var(--color-foreground-muted)]">
                  {analysis.disclaimer}
                </p>
              ) : null}
            </section>
          </>
        )}

        {/* Similar products */}
        {product.similarProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-h3 mb-6 text-[var(--color-foreground)]">Similar products</h2>
            <div className="product-grid">
              {product.similarProducts.map((similar) => (
                <ProductCard key={similar.id} product={similar} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
