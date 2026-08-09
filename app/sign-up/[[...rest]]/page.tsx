import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import { TrustOrb } from "@/components/ui/trust-orb";

/**
 * Sign-up route per sign-up.md. Mirrors the sign-in page — design-system auth
 * card hosting Clerk's <SignUp /> component. Appearance is inherited from the
 * global ClerkProvider theme.
 */
export default function SignUpPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <TrustOrb className="right-0 top-0 opacity-60" />

      <div className="auth-card relative w-full max-w-[400px] rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)] sm:p-8 md:p-12">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <h1 className="text-h3 mb-6 text-center text-[var(--color-foreground)]">
          Create your account
        </h1>

        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          // No forceRedirectUrl — it would override the `redirect_url` query
          // param; fallbackRedirectUrl handles the no-param default instead.
          fallbackRedirectUrl="/"
        />

        <p className="text-body-sm mt-6 text-center text-[var(--color-foreground-muted)]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
