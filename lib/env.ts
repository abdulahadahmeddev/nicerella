/**
 * Shared env helpers.
 *
 * Centralizes the "missing required environment variable" error so server
 * modules don't each hand-write the message. Optional `hint` lets callers add
 * domain context (e.g. which feature the variable gates) while keeping the
 * message shape consistent.
 */
export function requireEnv(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    const suffix = hint ? ` ${hint}` : "";
    throw new Error(
      `Missing required environment variable "${name}"${suffix}. Add it to .env.local and restart the dev server.`,
    );
  }
  return value;
}
