import posthog from "posthog-js";

import { posthogEnv } from "./env";

/**
 * Client-side event capture. Safe to call from any client component: no-ops
 * when PostHog is not configured or not yet initialized (e.g. before hydration
 * finishes). Never throws.
 */
export function track(event: string, properties: Record<string, unknown> = {}) {
  try {
    if (!posthogEnv().enabled || !posthog.__loaded) return;
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the UI.
  }
}
