/**
 * Static article content for the /articles section.
 *
 * These are editorial pieces about review authenticity and AI trust scoring.
 * They exist as data (not a CMS or runtime AI generation) so the pages are
 * static, fast, and SEO-friendly. Each article ends with a pricing CTA.
 */

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date, e.g. "2026-08-01"
  readingMinutes: number;
  tag: string;
  /** Plain-text paragraphs. */
  content: string[];
  /** Optional takeaway box shown before the pricing CTA. */
  keyPoints?: string[];
}

export const ARTICLES: Article[] = [
  {
    slug: "how-fake-reviews-work",
    title: "How fake reviews are made — and how to catch them",
    excerpt:
      "Fake reviews come in coordinated bursts, copied phrasing, and suspiciously perfect five-star patterns. Here's what the signals look like.",
    date: "2026-08-01",
    readingMinutes: 6,
    tag: "Detection",
    content: [
      "Fake reviews are a business. Some sellers pay for reviews directly, others use 'review clubs' where members trade five-star ratings, and a growing number use bots to flood a product page with near-identical praise within a single week.",
      "The first tell is timing. Real reviews arrive steadily over a product's lifetime. Fake campaigns arrive in bursts — twenty reviews in two days, then nothing for months. Bursts are the single strongest signal that a page has been gamed.",
      "The second tell is language. Bought reviews reuse a narrow vocabulary of superlatives ('amazing', 'perfect', 'best ever') and rarely describe a specific use case. Genuine reviews mention real details: how the product was used, how it held up, what disappointed them.",
      "The third tell is the reviewer itself. Fresh accounts with no purchase history, reviews posted minutes apart, or the same phrasing appearing across many products are classic bot signatures.",
      "Nicerella scans for all of these automatically — timing patterns, duplicate phrasing, incentivized language, and reviewer behavior — and distills the result into a single trust score you can read at a glance.",
    ],
    keyPoints: [
      "Review bursts: many reviews in a short window = coordinated campaign",
      "Duplicated phrasing across products = copy-pasted bot text",
      "Generic superlatives without real detail = bought review language",
    ],
  },
  {
    slug: "trust-score-explained",
    title: "How our trust score works — a plain-English explainer",
    excerpt:
      "0 to 1, five labels, and a disclaimer. Here's exactly what goes into a Nicerella trust score and what it does and doesn't prove.",
    date: "2026-07-22",
    readingMinutes: 5,
    tag: "How it works",
    content: [
      "Every product on Nicerella gets a trust score between 0 and 1. It is not a product quality score — it measures how trustworthy the review history appears to be.",
      "The score combines three things: how confidently our AI classifies the reviews as authentic, how many red flags were found (bursts, duplicates, incentivized language), and the estimated percentage of fake or bot-written reviews.",
      "A score of 0.85 or higher maps to 'highly trustworthy' — strong evidence of organic, authentic reviews. Below 0.2 the evidence points to 'likely manipulated', meaning the review history shows strong signs of coordination or bot generation.",
      "The middle band — 'mixed' — is where most real products land. Real products have occasional complaints and imperfect reviews; that honesty is itself a good sign. A page that is suspiciously perfect is usually the one to worry about.",
      "One important caveat: this is an AI estimate, not a certified fraud finding. A low score is a reason to look closer, not a legal accusation. We always attach that disclaimer so the score is read responsibly.",
    ],
    keyPoints: [
      "Trust score = authenticity confidence + red flags + estimated fake percentage",
      "Imperfect but honest reviews usually score higher than suspiciously perfect ones",
      "Scores are AI estimates with a disclaimer, not certified findings",
    ],
  },
  {
    slug: "incentivized-review-red-flags",
    title: "Incentivized reviews: free products, five stars",
    excerpt:
      "When reviewers receive free products or discounts in exchange for a review, the reviews skew positive. Here's how to spot the pattern.",
    date: "2026-07-10",
    readingMinutes: 7,
    tag: "Red flags",
    content: [
      "Incentivized reviews are reviews written in exchange for a free product, a discount, or a gift card. They are not bots — they are real people — but their incentives change what they write.",
      "A reviewer who received the product for free rarely criticizes it. That skews a product's average upward and hides real quality problems from shoppers who paid full price.",
      "The language gives it away. Incentivized reviews frequently mention the arrangement itself ('I received this product for free in exchange for my honest review') and lean heavily on 'honest review' phrasing — which is itself a sign the reviewer feels the need to defend their credibility.",
      "They also cluster in timing. A seller running an incentivized program will see a sudden wave of four- and five-star reviews, often with minimal detail about actual use.",
      "Nicerella flags incentivized-review language as a red flag and counts it against the trust score, so a page padded with 'free product' reviews is marked accordingly rather than taken at face value.",
    ],
    keyPoints: [
      "Free-product reviewers rarely criticize the product",
      "'In exchange for my honest review' is itself a red flag phrase",
      "Incentivized reviews cluster in time and skew positive",
    ],
  },
  {
    slug: "how-to-read-product-reviews",
    title: "How to read a product review section like a skeptic",
    excerpt:
      "A practical checklist for evaluating any review section — star ratings, verified badges, helpful votes, and what they actually tell you.",
    date: "2026-06-28",
    readingMinutes: 8,
    tag: "Shopping",
    content: [
      "Start with the one-star and three-star reviews, not the five-star ones. The extremes are where real problems get described: specific failures, poor durability, misleading photos, bad sizing.",
      "Ignore the overall star average until you understand the distribution. A 4.8 average with a graph that is mostly five-stars and one-stars is very different from a 4.8 with an honest bell curve.",
      "Verified purchase badges are helpful but not decisive. They confirm a purchase happened; they do not confirm the reviewer's experience is representative. A burst of verified five-stars right after launch is still a burst.",
      "Read for specific details. 'Broke after two weeks' beats 'great product' every time. Specific, concrete, slightly-negative reviews are the most information-dense signal on any product page.",
      "Finally, compare review counts to sales volume. A product with huge sales and few reviews is under-reviewing; a product with a mountain of reviews right after launch is usually advertising.",
    ],
    keyPoints: [
      "Read the one-star reviews for real failure modes",
      "Distribution matters more than the average",
      "Specific detail = credible review; superlatives = be wary",
    ],
  },
  {
    slug: "why-review-sources-matter",
    title: "Why review source matters as much as review content",
    excerpt:
      "The same product can look radically different across marketplaces. Here's how Nicerella weighs the source of every review.",
    date: "2026-06-12",
    readingMinutes: 5,
    tag: "Methodology",
    content: [
      "A marketplace's review ecosystem has its own culture and incentives. Some platforms aggressively police fake reviews; others do little. The same seller can maintain very different review histories on different platforms.",
      "Platforms that require a confirmed purchase for every review produce cleaner data. Platforms where anyone can leave a review — or where sellers can gift products for reviews — need closer scrutiny.",
      "Because of this, Nicerella stores the source of every review alongside its content. When you see a trust score, you also see which source it came from, so the context is transparent.",
      "We also refresh analyses regularly. Reviews change, campaigns start and end, and a product that looked trustworthy last month may not be this month. Daily refreshes keep the score current.",
      "Transparency about source is part of our core promise: the score is only useful if you can see what went into it and where the data came from.",
    ],
    keyPoints: [
      "Platform enforcement differs — so source context matters",
      "Nicerella shows the source of every review in the analysis",
      "Daily refreshes keep scores current as review histories change",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): Article[] {
  return ARTICLES.filter((a) => a.slug !== slug).slice(0, limit);
}
