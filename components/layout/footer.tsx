"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, TrendUpIcon } from "@/components/ui/icons";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="page-container py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-[var(--color-foreground)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="text-body font-semibold">nicerella</span>
            </Link>
            <p className="text-body-sm mt-3 max-w-xs text-[var(--color-foreground-muted)]">
              AI-powered review authenticity. Detect fake, bot-written, or
              incentivized reviews and get honest trust scores.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <nav>
              <h3 className="text-label mb-3 text-[var(--color-foreground)]">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-body-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-body-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/articles"
                    className="text-body-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-body-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
            <nav>
              <h3 className="text-label mb-3 text-[var(--color-foreground)]">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-body-sm text-[var(--color-foreground-muted)]">
                    Privacy
                  </span>
                </li>
                <li>
                  <span className="text-body-sm text-[var(--color-foreground-muted)]">
                    Terms
                  </span>
                </li>
              </ul>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-label mb-3 text-[var(--color-foreground)]">
              Stay in the loop
            </h3>
            <p className="text-body-sm mb-3 text-[var(--color-foreground-muted)]">
              Weekly digest of newly analyzed products and review trust insights.
            </p>
            {status === "success" ? (
              <div className="flex items-center gap-2 text-body-sm text-[var(--trust-high)]">
                <CheckIcon size={16} weight="bold" />
                You&apos;re subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input flex-1 text-body-sm"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-primary flex items-center gap-1.5 text-body-sm"
                >
                  <TrendUpIcon size={14} weight="fill" />
                  {status === "submitting" ? "..." : "Subscribe"}
                </button>
              </form>
            )}
            {status === "error" ? (
              <p className="text-caption mt-2 text-[var(--color-destructive)]">
                Something went wrong. Please try again.
              </p>
            ) : null}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-caption sm:flex-row">
          <span className="text-[var(--color-foreground-muted)]">
            &copy; {new Date().getFullYear()} Nicerella. All rights reserved.
          </span>
          <span className="text-[var(--color-foreground-muted)]">
            AI estimates, not certified fraud findings.
          </span>
        </div>
      </div>
    </footer>
  );
}
