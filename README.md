# Nicerella

AI-powered product review trust and authenticity platform. Nicerella collects real product reviews from configured e-commerce sources, analyzes them with AI to detect fake, bot-written, incentivized, or manipulated reviews, stores everything in Supabase, and displays a reader-friendly trust score and review breakdown for every product.

## Stack

- **Next.js** (App Router, server components) + TypeScript
- **Clerk** — authentication
- **Supabase** — Postgres, RLS, pgvector similarity search, service-role access
- **Oxylabs** — Web Scraper API + Scheduler for recurring listing scraping
- **Vercel AI SDK** — trust analysis (provider failover: Cerebras → Gemini → Groq → Hugging Face → Mistral)
- **Stripe** — Pro/Enterprise subscriptions, 14-day no-card free trial, Billing Portal
- **PostHog** — product analytics (pageviews, identity, billing + pipeline events)
- **Google AdSense** — optional responsive ad slots (off until approved)
- **Vercel Cron** — automatic scheduled-result processing + analysis
- **Tailwind CSS** + shadcn-style UI

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys (all optional)
npm run dev
```

Open http://localhost:3000. See `.env.example` for every variable and what it gates.

## Project layout

- `app/` — pages and API routes
- `app/api/` — thin route handlers (scrape, analyze, oxylabs, stripe, cron)
- `components/` — UI components (layout, billing, ads, analytics, ui)
- `lib/api/` — UI data-access seam (server-only, reads stored data)
- `lib/data/` — Supabase data layer
- `lib/pipeline/` — scrape + analysis orchestration
- `lib/scraping/` — Oxylabs + parsing
- `lib/ai/` — AI analysis + embeddings
- `lib/stripe/` — billing integration
- `lib/posthog/`, `lib/ads/` — analytics + AdSense config
- `supabase/` — schema, migrations, pgvector SQL
- `prompts/` — implementation prompts (AGENTS.md workflow)

## Core flows

- **Scraping** — `POST /api/scrape` (admin secret) runs the scrape-to-insert pipeline: listing pages → candidate product links → detail + review scraping → validation → append-only insert.
- **Analysis** — `POST /api/analyze` (admin secret) runs AI trust analysis on pending products, computes the 0–1 trust score, stores the analysis, and embeds it for pgvector similarity.
- **Scheduling** — Oxylabs Scheduler scrapes listing pages on a recurring schedule; `GET /api/cron/pipeline` (Vercel Cron) processes completed jobs and runs analysis automatically.
- **Billing** — `/pricing` starts a Stripe Checkout (14-day no-card trial). Webhooks mirror subscription state into `subscriptions`; the server-side `ProGate` ships gated analysis only to Pro users.

## Deployment (Vercel)

1. Push the repo to GitHub and import into Vercel.
2. Set the env vars from `.env.example` (plus `CRON_SECRET` in Vercel's Cron settings).
3. Configure Vercel Cron via `vercel.json` (add it after pushing, then deploy).
4. Add the Stripe webhook endpoint `https://<your-app>.vercel.app/api/stripe/webhook` in the Stripe Dashboard, subscribed to `checkout.session.completed` and `customer.subscription.*`.

See `AGENTS.md` for the full architecture and operational rules.
