/**
 * Canonical site origin, used for metadata, sitemap, and robots.
 *
 * Resolution order: NEXT_PUBLIC_SITE_URL → Vercel deployment URL →
 * localhost. This lets the same build work locally and in production without
 * hardcoding a domain.
 */
export function siteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
