import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import { TrustOrb } from "@/components/ui/trust-orb";

/**
 * Sign-in route per sign-in.md. Renders the design-system auth card (Logo,
 * heading, auth-card-enter animation) hosting Clerk's <SignIn /> component.
 * Appearance is inherited from the global ClerkProvider theme.
 */
export default function SignInPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <TrustOrb className="left-0 top-0 opacity-60" />

      <div className="auth-card relative w-full max-w-[400px] rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)] sm:p-8 md:p-12">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-h3 mb-6 text-center text-[var(--color-foreground)]">
          Welcome back
        </h1>

        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          // No forceRedirectUrl — that would override Clerk's `redirect_url`
          // query param (pricing-card.tsx sends `?redirect_url=/pricing` so a
          // signed-out user returns to the plan they clicked). fallbackRedirectUrl
          // is the default when no redirect_url param is present.
          fallbackRedirectUrl="/"
        />

        <p className="text-body-sm mt-6 text-center text-[var(--color-foreground-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
