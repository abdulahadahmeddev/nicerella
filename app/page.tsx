import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { TrustOrb } from "@/components/ui/trust-orb";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads/env";
import { getProducts } from "@/lib/api/products";
import { ProductCatalog } from "@/components/home/product-catalog";

// Static page (no auth/cookies): revalidate at most every 5 minutes so the
// grid reflects new analyses without hammering Supabase on every view. The
// pipeline also calls revalidateTag("products") after scrape/analyze runs.
export const revalidate = 300;

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <Header actions={<AuthActions />} />

      <main className="relative flex-1 overflow-hidden">
        {/* Decorative orb behind the hero */}
        <TrustOrb className="left-1/2 top-0 -translate-x-1/2" />

        {/* Hero + product grid (client island so the hero search filters the grid) */}
        <ProductCatalog products={products} />

        {/* Ad slot below the product grid */}
        <section className="page-container pb-16">
          <AdSlot slot={AD_SLOTS.homeBelowGrid} />
        </section>
      </main>
    </>
  );
}
