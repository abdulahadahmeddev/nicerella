import "server-only";

import { siteUrl } from "@/lib/site";

/**
 * Same-site request check (CSRF defense) for Clerk-authenticated mutating
 * routes. A browser always sends an `Origin` header on cross-origin and
 * same-origin POSTs; a cross-site attacker's form/fetch carries their origin,
 * so verifying it rejects forged requests before any side effect (checkout
 * session creation, portal session, etc.). Server-to-server callers (curl,
 * CI) that omit Origin are rejected by design — these routes are
 * browser-originated only.
 */

/** Dev-only allowlists (not honored in production — see production guard below). */
const DEV_HOST_SUFFIXES = [".app.github.dev", ".vercel.app"] as const;

export function isSameSiteRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originHost = new URL(origin).host;
    // Production: only exact-match the same origin or the configured siteUrl.
    // The dev suffixes and localhost checks are gated below so an attacker on
    // any *.vercel.app or *.app.github.dev subdomain cannot forge the check.
    if (origin === new URL(request.url).origin) return true;
    if (origin === siteUrl()) return true;

    // Dev only: allow localhost (arbitrary port) and Codespaces / Vercel
    // preview forwards so the checkout/portal POSTs work in development.
    if (process.env.NODE_ENV === "production") return false;
    if (originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1")) return true;
    return DEV_HOST_SUFFIXES.some((suffix) => originHost.endsWith(suffix));
  } catch {
    return false;
  }
}
