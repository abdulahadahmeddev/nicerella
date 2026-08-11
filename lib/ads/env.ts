/**
 * AdSense configuration.
 *
 * Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (e.g. "ca-pub-1234567890123456") once
 * AdSense is approved. Until then ad slots render nothing and the loader
 * script is omitted. Ad unit slot IDs are placement-specific; replace the
 * placeholders below with your real AdSense ad-unit IDs.
 *
 * Both the client ID and slot IDs are validated against AdSense's real shapes
 * (a `ca-pub-` client and a numeric slot). Placeholder values like `()` or
 * `1234567890` are treated as unconfigured so they can never load broken ads —
 * `Boolean("()")` is `true`, so a truthiness check alone is not enough.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

/** Real AdSense client IDs look like `ca-pub-` followed by 16+ digits. */
export const AD_CLIENT_ID = /^ca-pub-[0-9]{16,}$/.test(CLIENT_ID) ? CLIENT_ID : "";

export function adsenseConfigured(): boolean {
  return AD_CLIENT_ID.length > 0;
}

/** Real AdSense ad-unit slot IDs are plain digit strings. */
function validSlot(value: string | undefined): string {
  return value && /^[0-9]{5,}$/.test(value) ? value : "";
}

/** Ad unit IDs per placement — replace with real AdSense slot numbers. */
export const AD_SLOTS = {
  homeBelowGrid: validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME),
  productBelowHero: validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT),
  articlesIndex: validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES),
  articleBottom: validSlot(process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE),
} as const;
