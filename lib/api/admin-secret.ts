import "server-only";
import { timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

/**
 * Admin secret validation (AGENTS.md section 15).
 *
 * Operational routes that start or mutate work — and the read routes that
 * expose operational data — require a shared admin secret sent as the
 * `x-nicerella-admin-secret` request header, compared against the
 * `NICERELLA_ADMIN_SECRET` environment variable.
 *
 * The comparison is timing-safe so a response time cannot reveal how many
 * leading bytes of the header match the real secret. The secret is never
 * logged or returned.
 */
/**
 * Cached at module load: the admin secret is fixed at boot and never changes
 * for the lifetime of a serverless instance, so a per-request read (and the
 * env lookup it implies) is wasted work.
 */
const cachedSecret = process.env.NICERELLA_ADMIN_SECRET;

function adminSecret(): string {
  if (!cachedSecret || cachedSecret.length === 0) {
    // Reuses the shared message shape via requireEnv (throws).
    return requireEnv("NICERELLA_ADMIN_SECRET");
  }
  return cachedSecret;
}

/** True when the request carries the correct admin secret header. */
export function isAdminRequest(request: Request): boolean {
  const header = request.headers.get("x-nicerella-admin-secret");
  if (!header) return false;

  const a = Buffer.from(header);
  const b = Buffer.from(adminSecret());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
