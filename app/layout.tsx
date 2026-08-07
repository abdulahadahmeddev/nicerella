import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nicerella — Trustworthy product reviews",
  description:
    "AI-powered review authenticity. Nicerella analyzes product reviews to surface fake, bot-written, or incentivized reviews and gives every product an honest trust score.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error — internal Clerk escape hatch to stop router.refresh() after
      // auth state changes, which broke sign-in/sign-out redirects (see AGENTS.md §auth).
      // Supported at runtime (ClerkProvider.js destructures it); stripped from the public type.
      __internal_invokeMiddlewareOnAuthStateChange={false}
    >
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
