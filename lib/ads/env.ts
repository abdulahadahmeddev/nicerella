/**
 * AdSense configuration.
 *
 * Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (e.g. "ca-pub-1234567890123456") once
 * AdSense is approved. Until then — and while any known placeholder value is
 * set — ad slots render nothing and the loader script is omitted, so no broken
 * ad requests fire against Google. Ad unit slot IDs are placement-specific;
 * replace the placeholders below with your real AdSense ad-unit IDs.
 *
 * The known placeholder values (the ones shipped in .env.example) are treated
 * as "not configured": a placeholder client id or slot id must never produce a
 * pagead2 script tag or an `ins.adsbygoogle` unit.
 */

/** Placeholder publisher ids that must not load the ad script. */
const PLACEHOLDER_CLIENT_IDS = new Set([
  "ca-pub-1234567890123456",
  "ca-pub-0000000000000000",
]);

export const AD_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export function adsenseConfigured(): boolean {
  return Boolean(AD_CLIENT_ID) && !PLACEHOLDER_CLIENT_IDS.has(AD_CLIENT_ID);
}

/** Placeholder ad-unit slot ids shipped in .env.example (or all-zero). */
const PLACEHOLDER_SLOT_IDS = new Set([
  "1234567890",
  "1234567891",
  "1234567892",
  "1234567893",
]);

/** True when a slot value is a known placeholder and must not render. */
export function isPlaceholderSlot(slot: string): boolean {
  return PLACEHOLDER_SLOT_IDS.has(slot) || /^0+$/.test(slot);
}

/** Ad unit IDs per placement — replace with real AdSense slot numbers. */
export const AD_SLOTS = {
  homeBelowGrid: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? "1234567890",
  productBelowHero: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT ?? "1234567891",
  articlesIndex: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES ?? "1234567892",
  articleBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE ?? "1234567893",
} as const;
