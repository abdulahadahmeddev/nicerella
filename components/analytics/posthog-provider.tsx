"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { PostHogProvider as PostHogProviderRaw } from "posthog-js/react";

import { posthogEnv } from "@/lib/posthog/env";

/**
 * PostHog client analytics.
 *
 * - Initializes posthog-js once (guarded so HMR/re-renders don't double-init).
 * - Captures a `$pageview` on every client-side route change.
 * - Identifies the signed-in Clerk user so their events land on one profile.
 *
 * Mounted once in the root layout. When `NEXT_PUBLIC_POSTHOG_KEY` is unset
 * everything is a no-op and children render untouched.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { enabled, clientKey, host } = posthogEnv();

  useEffect(() => {
    if (!enabled) return;
    if (posthog.__loaded) return;
    posthog.init(clientKey, {
      api_host: host,
      capture_pageview: false, // captured manually per route change below
      person_profiles: "identified_only", // no auto anonymous profiles
    });
  }, [enabled, clientKey, host]);

  if (!enabled) return <>{children}</>;

  return (
    <PostHogProviderRaw client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
        <PostHogIdentity />
      </Suspense>
      {children}
    </PostHogProviderRaw>
  );
}

/** Fires a $pageview whenever the path or query string changes. */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog.capture("$pageview", {
      pathname,
      search: searchParams?.toString() ?? "",
    });
  }, [pathname, searchParams]);

  return null;
}

/** Links the PostHog person to the signed-in Clerk user (and resets on sign-out). */
function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    } else {
      posthog.reset();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
