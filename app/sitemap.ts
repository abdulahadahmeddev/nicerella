import type { MetadataRoute } from "next";

import { ARTICLES } from "@/lib/data/articles";
import { siteUrl } from "@/lib/site";

// Products are added by the scraping/analysis pipeline, so regenerate on demand.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();

  // The sitemap must not break the build (or a deploy) when Supabase is not
  // configured yet. `listAnalyzedProducts` imports the service-role client,
  // whose env module throws at import time when the env vars are absent — so
  // load it dynamically here and degrade to no product URLs on any failure.
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { listAnalyzedProducts } = await import("@/lib/data/products");
    const products = await listAnalyzedProducts();
    productUrls = products.map((p) => ({
      url: `${origin}/products/${p.id}`,
      lastModified: p.analyzed_at ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    productUrls = [];
  }

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
