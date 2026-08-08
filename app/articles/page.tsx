import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads/env";
import { ARTICLES } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Articles — Nicerella",
  description:
    "Learn how fake reviews work, how trust scores are calculated, and how to read product reviews like a skeptic.",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ArticlesPage() {
  return (
    <>
      <Header actions={<AuthActions />} />

      <main className="page-container flex-1 py-8 sm:py-12">
        <Breadcrumb items={[{ label: "Articles" }]} />

        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-h1 text-[var(--color-foreground)]">Trust, explained</h1>
          <p className="text-body mx-auto mt-4 max-w-xl text-[var(--color-foreground-muted)]">
            Short guides on fake reviews, incentivized ratings, and how AI review
            analysis actually works.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="card group flex flex-col p-6 transition-colors hover:border-[var(--color-primary)]"
            >
              <span className="text-label text-[var(--color-primary)]">{article.tag}</span>
              <h2 className="text-h4 mt-3 text-[var(--color-foreground)] group-hover:text-[var(--color-primary-hover)]">
                {article.title}
              </h2>
              <p className="text-body-sm mt-2 flex-1 text-[var(--color-foreground-muted)]">
                {article.excerpt}
              </p>
              <p className="text-caption mt-4 text-[var(--color-foreground-muted)]">
                {formatDate(article.date)} · {article.readingMinutes} min read
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <AdSlot slot={AD_SLOTS.articlesIndex} />
        </div>
      </main>
    </>
  );
}
