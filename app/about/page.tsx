import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { AuthActions } from "@/components/layout/auth-actions";
import { TrustOrb } from "@/components/ui/trust-orb";
import { Button } from "@/components/ui/button";
import { siteUrl } from "@/lib/site";
import {
  ShieldCheckIcon,
  ShieldIcon,
  TrendUpIcon,
  StarIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About — Nicerella",
  description:
    "Nicerella uses AI to analyze product reviews and surface fake, bot-written, or incentivized reviews so shoppers can make informed decisions.",
  openGraph: {
    title: "About Nicerella — AI-powered review trust analysis",
    description:
      "We use AI to analyze product reviews and surface fake, bot-written, or incentivized reviews so shoppers can make informed decisions.",
    type: "website",
    url: `${siteUrl()}/about`,
  },
};

const VALUES = [
  {
    icon: ShieldCheckIcon,
    title: "Transparency",
    description:
      "Every trust score comes with a clear explanation of what went into it. We show our sources, our methodology, and the limitations of our analysis.",
  },
  {
    icon: ShieldIcon,
    title: "AI with a disclaimer",
    description:
      "Our analysis is an AI estimate, not a certified fraud finding. A low score is a reason to look closer, not a legal accusation. We always attach that context.",
  },
  {
    icon: TrendUpIcon,
    title: "Source-first",
    description:
      "Reviews come from real marketplaces. We track which source each review came from, so you can see the full context behind every trust score.",
  },
  {
    icon: StarIcon,
    title: "Built for shoppers",
    description:
      "Nicerella exists to help real people make better buying decisions. We are not a review platform — we are a trust layer on top of reviews that already exist.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header actions={<AuthActions />} />

      <main className="relative flex-1 overflow-hidden">
        <TrustOrb className="left-1/2 top-0 -translate-x-1/2" />

        <div className="page-container relative z-10 py-12 sm:py-16">
          {/* Hero */}
          <section className="mx-auto max-w-3xl text-center">
            <h1 className="text-h1 text-[var(--color-foreground)]">
              Trust is earned, not assumed
            </h1>
            <p className="text-body mx-auto mt-6 max-w-xl text-[var(--color-foreground-muted)]">
              Online shopping depends on reviews. But millions of reviews are
              fake, incentivized, or bot-generated. Nicerella exists to help
              shoppers see through the noise.
            </p>
          </section>

          {/* Mission */}
          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="text-h2 text-[var(--color-foreground)]">Our mission</h2>
            <div className="text-body mt-6 space-y-4 text-[var(--color-foreground-muted)]">
              <p>
                Every day, millions of shoppers read product reviews to decide
                what to buy. Many of those reviews are genuine. But a growing
                number are written by bots, paid reviewers, or sellers running
                incentivized review programs.
              </p>
              <p>
                The result is a trust problem. When you cannot tell which reviews
                are real, every product page becomes a coin flip — and shoppers
                end up with products that do not match the hype.
              </p>
              <p>
                Nicerella uses AI to analyze review patterns, timing, language,
                and reviewer behavior to produce a trust score for every product.
                It is not perfect, and it is not a legal finding. But it gives
                shoppers a signal they did not have before.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-h2 text-center text-[var(--color-foreground)]">
              What we stand for
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="card p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]">
                      <Icon
                        size={20}
                        weight="fill"
                        className="text-[var(--color-primary)]"
                      />
                    </div>
                    <h3 className="text-h4 text-[var(--color-foreground)]">
                      {value.title}
                    </h3>
                    <p className="text-body-sm mt-2 text-[var(--color-foreground-muted)]">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* How it works */}
          <section className="mx-auto mt-16 max-w-2xl">
            <h2 className="text-h2 text-[var(--color-foreground)]">
              How it works
            </h2>
            <div className="text-body mt-6 space-y-4 text-[var(--color-foreground-muted)]">
              <p>
                <strong className="text-[var(--color-foreground)]">1. We
                collect.</strong> Nicerella scrapes product listings and reviews
                from configured e-commerce sources via Oxylabs. Every product is
                deduped and every review is validated before storage.
              </p>
              <p>
                <strong className="text-[var(--color-foreground)]">2. We
                analyze.</strong> Our AI examines timing patterns, duplicate
                phrasing, incentivized-review language, and reviewer behavior
                to produce a trust score between 0 and 1.
              </p>
              <p>
                <strong className="text-[var(--color-foreground)]">3. We
                display.</strong> Every product gets a trust badge on the home
                grid. Pro users unlock the full sentiment breakdown, red-flag
                report, and similar-product comparisons.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="mx-auto mt-16 max-w-2xl text-center">
            <div className="card p-8">
              <h2 className="text-h3 text-[var(--color-foreground)]">
                Try Nicerella
              </h2>
              <p className="text-body-sm mx-auto mt-3 max-w-md text-[var(--color-foreground-muted)]">
                Free trust scores for every product. Upgrade for the full
                analysis.
              </p>
              <div className="mt-5">
                <Button href="/" size="lg">
                  Browse products
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
