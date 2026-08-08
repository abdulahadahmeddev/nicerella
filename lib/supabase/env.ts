import "server-only";

/**
 * Validates and exposes the Supabase env vars required by server-side code.
 * Importing this module in a client component fails at build time (server-only),
 * which protects the service-role key from ever reaching the browser.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable "${name}". Add it to .env.local and restart the dev server.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
} as const;
