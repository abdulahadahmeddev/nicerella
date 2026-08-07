"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Header auth controls. Client component so auth state stays live without
 * making the surrounding Server Component dynamic: when signed out it shows
 * the "Sign in" call-to-action, when signed in Clerk's UserButton. Redirects
 * after sign-in/sign-out are handled globally in app/layout.tsx.
 */
export function AuthActions() {
  return (
    <>
      <Show when="signed-out">
        <Button href="/sign-in" variant="primary" size="sm">
          Sign in
        </Button>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
