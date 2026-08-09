import "server-only";

import { NextResponse } from "next/server";

/**
 * Lightweight in-memory rate limiter for mutating API routes.
 *
 * Best-effort per-instance: on Vercel serverless a single warm instance often
 * serves repeated requests from one client, so this throttles same-client
 * floods (e.g. hammering /api/scrape or /api/stripe/checkout). It is NOT a
 * substitute for a distributed limiter (Upstash Redis, Vercel WAF, Cloudflare)
 * once traffic grows — see DEPLOYMENT_GUIDE.md. Zero dependencies, no Redis
 * account: keeps the free-tier / no-credit-card mission.
 */

interface Bucket {
  tokens: number;
  refilledAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweepAt = 0;

export interface RateLimitOptions {
  /** Max requests per window per client. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = { limit: 60, windowMs: 60_000 };

/** Client key: first x-forwarded-for hop, else x-real-ip, else unknown. */
function clientKey(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return ip;
}

/** Token-bucket check; refills continuously over the window. */
export function rateLimited(
  request: Request,
  options: Partial<RateLimitOptions> = {},
): { limited: boolean; retryAfterSec: number } {
  const { limit, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const key = clientKey(request);
  const now = Date.now();

  // Bound memory: sweep expired buckets at most once a minute.
  if (now - lastSweepAt > 60_000) {
    lastSweepAt = now;
    for (const [k, b] of buckets) {
      if (now - b.refilledAt > windowMs) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket) {
    buckets.set(key, { tokens: limit - 1, refilledAt: now });
    return { limited: false, retryAfterSec: 0 };
  }

  const elapsed = now - bucket.refilledAt;
  const refill = (elapsed / windowMs) * limit;
  bucket.tokens = Math.min(limit, bucket.tokens + refill);
  bucket.refilledAt = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { limited: false, retryAfterSec: 0 };
  }
  return { limited: true, retryAfterSec: Math.max(1, Math.ceil((windowMs - elapsed) / 1000)) };
}

/**
 * Rate-limit guard for route handlers. Returns a 429 Response when the client
 * is over the limit, or null when the request may proceed.
 */
export function guardRateLimit(
  request: Request,
  options?: Partial<RateLimitOptions>,
): Response | null {
  const { limited, retryAfterSec } = rateLimited(request, options);
  if (!limited) return null;
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
