import "server-only";
import { timingSafeEqual } from "node:crypto";

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
function adminSecret(): string {
  const secret = process.env.NICERELLA_ADMIN_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error(
      'Missing required environment variable "NICERELLA_ADMIN_SECRET". Add it to .env.local and restart the dev server.',
    );
  }
  return secret;
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
