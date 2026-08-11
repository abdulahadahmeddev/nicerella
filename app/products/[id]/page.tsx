import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card3D } from "@/components/ui/3d-card";
import { TrustMeter } from "@/components/ui/trust-meter";
import { SentimentChart } from "@/components/ui/sentiment-chart";
import { RedFlagsList } from "@/components/ui/red-flags-list";
import { ProductCard } from "@/components/ui/product-card";
import { TrendUpIcon } from "@/components/ui/icons";
import { ProGate } from "@/components/billing/pro-gate";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads/env";
import { getProduct } from "@/lib/api/products";
import { getUserPlan } from "@/lib/data/subscriptions";
import { auth } from "@clerk/nextjs/server";
import { siteUrl } from "@/lib/site";
import { JsonLd } from "@/components/ui/json-ld";
import { SocialShare } from "@/components/ui/social-share";

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return {
      title: "Product not found — Nicerella",
      robots: { index: false, follow: true },
    };
  }
  const trustPct = Math.round(product.trustScore * 100);
  const description =
    product.analysis?.neutralSummary?.slice(0, 155) ??
    `${product.title} — AI-assessed trust score of ${trustPct}% based on ${product.reviewCount} reviews.`;
  const images = product.imageUrl ? [{ url: product.imageUrl, alt: product.title }] : undefined;
  return {
    title: `${product.title} — Nicerella`,
    description,
    openGraph: {
      title: `${product.title} — Nicerella trust score`,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — Nicerella trust score`,
      description,
      images,
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  const { userId } = await auth();
  const plan = await getUserPlan(userId);

  if (!product) notFound();

  const analysis = product.analysis;

  return (
    <>
      <Header actions={<AuthActions />} />

      {analysis && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: product.imageUrl,
            url: `${siteUrl()}/products/${product.id}`,
            description:
              analysis.neutralSummary?.slice(0, 300) ??
              `AI trust score: ${Math.round(product.trustScore * 100)}% based on ${product.reviewCount} reviews.`,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Math.round(product.trustScore * 5 * 10) / 10,
              bestRating: 5,
              worstRating: 0,
              reviewCount: product.reviewCount,
            },
            review: {
              "@type": "Review",
              author: { "@type": "Organization", name: "Nicerella AI Analysis" },
              reviewRating: {
                "@type": "Rating",
                ratingValue: Math.round(product.trustScore * 100),
                bestRating: 100,
              },
              reviewBody: analysis.neutralSummary,
            },
          }}
        />
      )}

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
              <div className="mt-3">
                <SocialShare
                  title={`${product.title} — Nicerella trust score: ${Math.round(product.trustScore * 100)}%`}
                  url={`${siteUrl()}/products/${product.id}`}
                  description={`AI trust score: ${Math.round(product.trustScore * 100)}% based on ${product.reviewCount} reviews.`}
                />
              </div>
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
                  We&apos;re still reviewing the reviews for this product. Check back
                  shortly for its trust score.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ad slot between hero and analysis */}
        <div className="mt-10">
          <AdSlot slot={AD_SLOTS.productBelowHero} />
        </div>

        {/* Analysis breakdown — Pro-gated (server-side, not shipped to non-Pro) */}
        <ProGate isPro={plan.isPro}>
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
        </ProGate>
      </main>
    </>
  );
}
