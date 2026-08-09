import type { NextConfig } from "next";

/**
 * `serverActions.allowedOrigins` — dev-forwarding fix for Server Actions.
 *
 * GitHub Codespaces / dev-container port forwarding injects an `x-forwarded-host`
 * (e.g. `special-invention-...app.github.dev`) that differs from the browser's
 * `origin`. Next.js rejects Clerk's auth Server Actions with "Invalid Server
 * Actions request" because the CSRF check compares Origin to (X-Forwarded-)Host
 * (see node_modules/next/dist/docs/01-app/02-guides/server-actions.md).
 *
 * These are dev-only origins. Production (Vercel) is same-origin and needs none.
 */
/**
 * Baseline security headers applied to every response. Values are deliberately
 * strict-but-safe: no in-page framing, no sniffing, no camera/mic/geo
 * permissions. CSP is deliberately NOT set here — the app serves AI-generated
 * content, external review thumbnails, and provider scripts, so an overly
 * tight CSP would break production. Revisit with a CSP report-only policy
 * once the script allowlist is stable.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
] as const;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "*.app.github.dev"],
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      // HSTS is intentionally omitted — Vercel already sets it on HTTPS
      // responses; duplicating it can produce a conflicting header.
      headers: securityHeaders.map(({ key, value }) => ({ key, value })),
    },
  ],
};

export default nextConfig;