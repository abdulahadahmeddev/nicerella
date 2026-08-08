import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { env } from "./env";

/**
 * Service-role Supabase client for server-side code only (route handlers,
 * server components, server actions, cron). It bypasses RLS and holds the
 * full service-role key — never import this into a client component.
 *
 * The UI must not talk to Supabase directly (AGENTS.md section 5); it reads
 * through the app's own GET routes instead.
 */
export function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // This client is never used for Supabase Auth (Clerk owns auth);
      // disable the auth layer's storage/session machinery entirely.
      detectSessionInUrl: false,
    },
    db: { schema: "public" },
  });
}
