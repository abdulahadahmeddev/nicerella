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
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;