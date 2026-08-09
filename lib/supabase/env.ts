import "server-only";

import { requireEnv } from "@/lib/env";

/**
 * Validates and exposes the Supabase env vars required by server-side code.
 * Importing this module in a client component fails at build time (server-only),
 * which protects the service-role key from ever reaching the browser.
 */
export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
} as const;
