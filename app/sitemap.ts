import type { MetadataRoute } from "next";

import { listAnalyzedProducts } from "@/lib/data/products";
import { ARTICLES } from "@/lib/data/articles";
import { siteUrl } from "@/lib/site";

// Products are added by the scraping/analysis pipeline, so regenerate on demand.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();

  const products = await listAnalyzedProducts();
  const productUrls = products.map((p) => ({
    url: `${origin}/products/${p.id}`,
    lastModified: p.analyzed_at ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articleUrls = ARTICLES.map((a) => ({
    url: `${origin}/articles/${a.slug}`,
    lastModified: new Date(`${a.date}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/articles`, changeFrequency: "weekly", priority: 0.6 },
    ...articleUrls,
    ...productUrls,
  ];
}
