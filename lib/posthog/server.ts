import { PostHog } from "posthog-node";

import { posthogEnv } from "./env";

let client: PostHog | null = null;

/**
 * Returns a lazily-created PostHog node client, or null when server-side
 * analytics are not configured. Never throws when unconfigured.
 */
export function getPostHogServer(): PostHog | null {
  const { serverKey, host } = posthogEnv();
  if (!serverKey) return null;
  if (client) return client;
  client = new PostHog(serverKey, {
    host,
    // Send immediately in serverless so events aren't lost on cold shutdown.
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

/**
 * Fire-and-forget server event capture. Safe to call anywhere — no-ops when
 * PostHog is not configured, and never throws on network failure.
 */
export async function captureServerEvent(
  event: string,
  properties: Record<string, unknown> = {},
) {
  const ph = getPostHogServer();
  if (!ph) return;

  const distinctId = (properties.distinctId as string) || "server";
  const rest = { ...properties };
  delete rest.distinctId;

  try {
    ph.capture({ distinctId, event, properties: rest });
    await ph.flush();
  } catch {
    // Analytics must never take down a request.
  }
}
