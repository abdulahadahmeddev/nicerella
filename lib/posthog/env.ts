/**
 * PostHog configuration, read from environment.
 *
 * Client key lives in `NEXT_PUBLIC_POSTHOG_KEY` (safe to ship to the browser).
 * Server key lives in `POSTHOG_API_KEY` (project API key, server-only).
 * Both are optional: if unset, analytics are a no-op and the app still works.
 */
export function posthogEnv() {
  return {
    enabled: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
    clientKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
    serverKey: process.env.POSTHOG_API_KEY ?? "",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  };
}
