/**
 * AdSense configuration.
 *
 * Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (e.g. "ca-pub-1234567890123456") once
 * AdSense is approved. Until then ad slots render nothing and the loader
 * script is omitted. Ad unit slot IDs are placement-specific; replace the
 * placeholders below with your real AdSense ad-unit IDs.
 */
export const AD_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export function adsenseConfigured(): boolean {
  return Boolean(AD_CLIENT_ID);
}

/** Ad unit IDs per placement — replace with real AdSense slot numbers. */
export const AD_SLOTS = {
  homeBelowGrid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? "1234567890",
  productBelowHero: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT ?? "1234567891",
  articlesIndex: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES ?? "1234567892",
  articleBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE ?? "1234567893",
} as const;
