import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads/env";
import { ARTICLES, getArticle, getRelatedArticles } from "@/lib/data/articles";
import { siteUrl } from "@/lib/site";
import { JsonLd } from "@/components/ui/json-ld";
import { SocialShare } from "@/components/ui/social-share";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return {
    title: article ? `${article.title} — Nicerella` : "Article not found — Nicerella",
    description: article?.excerpt,
  };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.slug);

  return (
    <>
      <Header actions={<AuthActions />} />

      <main className="page-container flex-1 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Articles", href: "/articles" },
            { label: article.title },
          ]}
        />

        <article className="mx-auto max-w-2xl">
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.excerpt,
              datePublished: new Date(`${article.date}T00:00:00Z`).toISOString(),
              author: { "@type": "Organization", name: "Nicerella" },
              publisher: { "@type": "Organization", name: "Nicerella" },
              url: `${siteUrl()}/articles/${article.slug}`,
            }}
          />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-label text-[var(--color-primary)]">{article.tag}</span>
            <SocialShare
              title={article.title}
              url={`${siteUrl()}/articles/${article.slug}`}
              description={article.excerpt}
            />
          </div>
          <h1 className="text-h1 mt-3 text-[var(--color-foreground)]">{article.title}</h1>
          <p className="text-body-sm mt-3 text-[var(--color-foreground-muted)]">
            {formatDate(article.date)} · {article.readingMinutes} min read
          </p>

          <div className="mt-8 space-y-5">
            {article.content.map((paragraph, index) => (
              <p key={index} className="text-body leading-relaxed text-[var(--color-foreground)]">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10">
            <AdSlot slot={AD_SLOTS.articleBottom} />
          </div>

          {article.keyPoints ? (
            <aside className="card mt-8 p-6">
              <h2 className="text-h4 text-[var(--color-foreground)]">Key takeaways</h2>
              <ul className="mt-4 space-y-3">
                {article.keyPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-body-sm text-[var(--color-foreground)]"
                  >
                    <CheckIcon
                      size={16}
                      weight="bold"
                      className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}

          <section className="card mt-8 flex flex-col items-center p-8 text-center">
            <h2 className="text-h4 text-[var(--color-foreground)]">
              Check any product with an AI trust score
            </h2>
            <p className="text-body-sm mt-2 max-w-md text-[var(--color-foreground-muted)]">
              Free trust scores for every shopper. Upgrade for the full sentiment
              breakdown and red-flag report.
            </p>
            <div className="mt-5">
              <Button href="/pricing" size="lg">
                Start 14-day free trial
              </Button>
            </div>
          </section>
        </article>

        {related.length > 0 ? (
          <section className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-h3 text-[var(--color-foreground)]">Keep reading</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {related.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="card group flex flex-col p-5 transition-colors hover:border-[var(--color-primary)]"
                >
                  <span className="text-label text-[var(--color-primary)]">{article.tag}</span>
                  <h3 className="text-body-sm mt-2 font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary-hover)]">
                    {article.title}
                  </h3>
                  <p className="text-caption mt-2 text-[var(--color-foreground-muted)]">
                    {article.readingMinutes} min read
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
