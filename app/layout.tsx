import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { AD_CLIENT_ID, adsenseConfigured } from "@/lib/ads/env";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Nicerella — Trustworthy product reviews",
    template: "%s",
  },
  description:
    "AI-powered review authenticity. Nicerella analyzes product reviews to surface fake, bot-written, or incentivized reviews and gives every product an honest trust score.",
  openGraph: {
    siteName: "Nicerella",
    title: "Nicerella — Trustworthy product reviews",
    description:
      "AI-powered review authenticity. Detect fake, bot-written, or incentivized reviews and get honest trust scores.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nicerella — Trustworthy product reviews",
    description:
      "AI-powered review authenticity. Detect fake, bot-written, or incentivized reviews and get honest trust scores.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#0b0b12",
  colorScheme: "dark" as const,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      // @ts-expect-error — internal Clerk escape hatch to stop router.refresh()
      // after auth state changes, which broke sign-in/sign-out redirects. Verified
      // against @clerk/nextjs 7.7.0: the prop only suppresses router.refresh() in
      // __internal_onAfterSetActive; auth flows still work because onBeforeSetActive
      // invalidates the Router Cache and the redirect performs a full re-render.
      // Stripped from the public type — the @ts-expect-error above fails loudly if
      // Clerk ever exposes it. RE-VERIFY sign-in/sign-out redirects after every
      // @clerk/nextjs upgrade; remove this once the upstream race is fixed.
      __internal_invokeMiddlewareOnAuthStateChange={false}
    >
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col">
          {adsenseConfigured() ? (
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT_ID}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          ) : null}
          <PostHogProvider>{children}</PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
