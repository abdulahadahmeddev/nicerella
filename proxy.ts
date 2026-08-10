import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware (Next.js 16 — see node_modules/next/dist/docs
 * 01-app/03-api-reference/03-file-conventions/proxy.md; middleware.ts is
 * deprecated in favor of proxy.ts).
 *
 * No route matcher: Clerk v7 deprecates `createRouteMatcher` in favor of
 * resource-based auth checks — call `await auth()` / `auth.protect()` inside
 * each page, layout, API route, or Server Function that accesses protected
 * data. nicerella has no Clerk-protected area yet (AGENTS.md §1): browsing
 * routes are public and API routes are protected by NICERELLA_ADMIN_SECRET
 * (AGENTS.md §15), not Clerk. `clerkMiddleware()` here still runs Clerk's
 * session/cookie plumbing so server-side `auth()` works when protection is
 * added later.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search
    // params, to avoid running Clerk on every asset request.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes so Clerk session auth is available there.
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API proxy routes. This is what
    // serves /__clerk/npm/.../clerk.browser.js — without this the .js skip
    // rule above would 404 Clerk's bundle and auth would never mount.
    "/__clerk/(.*)",
  ],
};
