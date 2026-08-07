import type { Product, ProductDetail } from "@/lib/types/product";

/**
 * UI data-access seam (section 5: UI displays stored data only).
 *
 * Currently returns the empty state because the Supabase + API-route data
 * milestone has not landed yet — no product rows exist, so an empty grid /
 * product-not-found is the truthful state. When that layer is built, replace
 * these bodies with reads against the app's own GET routes
 * (`/api/products`, `/api/products/[id]`), which in turn query Supabase.
 */
export async function getProducts(): Promise<Product[]> {
  return [];
}

export async function getProduct(_id: string): Promise<ProductDetail | null> {
  return null;
}
