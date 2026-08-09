# Nicerella — Deployment Guide

Step-by-step click-by-click instructions to take Nicerella from a local clone to a live production app on Vercel.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup](#2-supabase-setup)
3. [Clerk Setup](#3-clerk-setup)
4. [Oxylabs Setup](#4-oxylabs-setup)
5. [Stripe Setup](#5-stripe-setup)
6. [PostHog Setup](#6-posthog-setup)
7. [AI Provider Keys](#7-ai-provider-keys)
8. [Google AdSense (optional)](#8-google-adsense-optional)
9. [Local .env.local](#9-local-envlocal)
10. [Apply Database Schema](#10-apply-database-schema)
11. [Seed Demo Data (optional)](#11-seed-demo-data-optional)
12. [Verify Locally](#12-verify-locally)
13. [Vercel Deployment](#13-vercel-deployment)
14. [Configure Vercel Cron](#14-configure-vercel-cron)
15. [Stripe Webhook Configuration](#15-stripe-webhook-configuration)
16. [Oxylabs Schedule Sync (one-time)](#16-oxylabs-schedule-sync-one-time)
17. [Run a Manual Scrape](#17-run-a-manual-scrape)
18. [Post-Deploy Smoke Tests](#18-post-deploy-smoke-tests)
19. [Known Deferred Improvements](#19-known-deferred-improvements)
20. [Rollback](#20-rollback)

---

## 1. Prerequisites

Create free (or paid where noted) accounts on:

| Service | Purpose | Cost |
|---|---|---|
| [GitHub](https://github.com) | Source control & Vercel deploy trigger | Free |
| [Supabase](https://supabase.com/dashboard) | PostgreSQL + pgvector + RLS | Free tier sufficient |
| [Clerk](https://dashboard.clerk.com) | User authentication | Free tier: 10k MAU |
| [Oxylabs](https://oxylabs.io) | Web scraping API + Scheduler | Paid (pay-per-scraper request) |
| [Stripe](https://dashboard.stripe.com) | Billing / Pro plan subscriptions | No setup fee; test mode free |
| [PostHog](https://posthog.com) | Analytics | Free tier: 1M events/mo |
| [Vercel](https://vercel.com) | Hosting + Cron jobs | Free tier sufficient for low traffic |
| [OpenAI](https://platform.openai.com) | Fallback AI provider (embedding + analysis) | Pay-per-token |
| [Gemini](https://aistudio.google.com) | Primary AI provider for analysis | Free tier generous |
| [Groq](https://console.groq.com) | Failover AI provider | Free tier available |
| [Cerebras](https://cloud.cerebras.ai) | Failover AI provider | Free tier available |
| [Mistral](https://mistral.ai) | Failover AI provider | Free API key |
| [Hugging Face](https://huggingface.co) | Failover AI provider | Free token |

**Minimum viable set** (to run the app with basic analysis): Clerk + Supabase + **one** AI key + Vercel. Everything else is optional but expected for production.

---

## 2. Supabase Setup

### 2.1 Create a project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Pick a project name (e.g. `nicerella`).
4. Choose a region closest to your users.
5. Generate a strong random password for the database (or use Supabase-generated).
6. Click **Create New Project**. Wait ~2 minutes for provisioning.

### 2.2 Grab credentials

1. In your project dashboard, go to **Settings → API** (left sidebar).
2. Copy these two values — you will need them shortly:
   - **Project URL**: looks like `https://xxxxx.supabase.co`
   - **anon public key**: starts with `eyJ...`
3. Click **Service Role** tab (near the top) to reveal the **service_role key** — starts with `eyJ...`. This is the high-privilege key. **Keep it secret.**

---

## 3. Clerk Setup

### 3.1 Create a Clerk application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com).
2. Click **Add application**.
3. Name it `nicerella` and choose a frontend domain (e.g. `*.vercel.app` for now — you'll update after Vercel deploy).
4. Click **Create application**.

### 3.2 Grab Clerk keys

1. Go to **API Keys** in the left sidebar.
2. Copy:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)
3. Go to **Email / SMS** and make sure **Email link sign-in** and **Email password** are enabled.
4. Go to **Users** and note that Clerk tracks users by Clerk `user_id` (this is what Nicerella stores in the `subscriptions.user_id` column).

### 3.3 Configure allowed URLs

1. Go to **URL Settings** in the left sidebar.
2. Under **Allowed URLs**, add:
   - `http://localhost:*` (for local dev)
   - `https://<your-project>.vercel.app` (for production — update after Step 13)
   - `https://www.<your-domain>.com` (if you have a custom domain)

---

## 4. Oxylabs Setup

### 4.1 Create an account

1. Go to [Oxylabs](https://oxylabs.io) and sign up.
2. Verify your email.

### 4.2 Grab credentials

1. Go to **Dashboard → My Account** (or **API Access**).
2. Copy your **Web Scraper API username** and **password** (these are separate from your login credentials — look for "Web Scraper API" credentials specifically).

### 4.3 Understand pricing

- Oxylabs charges per scraper request. Budget accordingly: a typical scrape of 5 sources × 5 products each may generate 30–50 scraper requests.
- The Scheduler feature (for automatic recurring scrapes) is a separate paid add-on. Start with manual scraping and enable Scheduler once the app is live.

---

## 5. Stripe Setup

### 5.1 Create a Stripe account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com).
2. Sign up (or log in).
3. Switch to **Test mode** by toggling the switch in the top-right corner. **All initial setup should be in test mode.**

### 5.2 Create pricing products

Nicerella auto-creates prices on first Pro checkout via `lib/stripe/plans.ts`, but you can pre-create them for better control.

**Via Stripe Dashboard:**

1. Go to **Products → Add product**.
2. Create the following four prices (two per plan):
   - **Pro Monthly**: `nicerella-pro-monthly` (lookup key)
   - **Pro Yearly**: `nicerella-pro-yearly` (lookup key)
   - **Enterprise Monthly**: `nicerella-enterprise-monthly` (lookup key)
   - **Enterprise Yearly**: `nicerella-enterprise-yearly` (lookup key)
3. Set prices (e.g. Pro Monthly = $19/mo, Pro Yearly = $179/yr).
4. Under **Pricing type**, choose **Fixed amount**.
5. Under **Billing scheme**, choose **Per unit**.
6. Save each product.
7. Copy the **Price ID** (starts with `price_...`) and the **Lookup Key** for each. You'll paste the lookup keys into `.env.local` later (`STRIPE_PRICE_PRO_MONTHLY`, etc.).
8. If you skip manual creation, Nicerella will auto-create these via the API on first checkout — the lookup keys are hardcoded in `lib/stripe/plans.ts`.

### 5.3 Grab API keys

1. Go to **Developers → API keys**.
2. Copy the **Secret key** (starts with `sk_test_...`).
3. Go to **Developers → Webhooks → Add endpoint**.
   - **Endpoint URL**: `https://<your-production-url>/api/stripe/webhook` (add after Step 13).
   - **Events to send**: select `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
   - Click **Add endpoint**.
4. Copy the **Webhook signing secret** (starts with `whsec_...`).

---

## 6. PostHog Setup

1. Go to [PostHog](https://app.posthog.com/project/settings/project) and sign up.
2. Create a new project called `nicerella`.
3. Go to **Project Settings**.
4. Copy:
   - **Project API key** (starts with `phc_...`)
   - **Host URL** (usually `https://us.i.posthog.com`)
5. Go to **Project Settings → Ingestion** to find the **Server API key** (starts with `phx_...`).

---

## 7. AI Provider Keys

Nicerella's AI analysis uses a failover chain: **Gemini → Groq → Cerebras → Mistral → HuggingFace**. Only the first available key is used. Providing at least one is sufficient.

| Provider | Required? | Where to get key |
|---|---|---|
| Gemini (`GEMINI_API_KEY`) | Recommended | [AI Studio](https://aistudio.google.com/app/apikey) |
| Groq (`GROQ_API_KEY`) | Optional | [Groq Console](https://console.groq.com/keys) |
| Cerebras (`CEREBRAS_API_KEY`) | Optional | [Cerebras Cloud](https://cloud.cerebras.ai) |
| Mistral (`MISTRAL_API_KEY`) | Optional | [Mistral Console](https://console.mistral.ai/api-keys) |
| HuggingFace (`HUGGINGFACE_API_KEY`) | Optional | [Hugging Face Settings](https://huggingface.co/settings/tokens) |

**Action:** Generate at least one key and store it. The app will attempt them in order and return an error if none are available.

---

## 8. Google AdSense (optional)

Ad slots render nothing until you have an approved AdSense account. Skip this for now and fill it in later.

1. Apply at [Google AdSense](https://www.google.com/adsense).
2. Once approved, copy your **Client ID** (`ca-pub-...`) and the **slot IDs** for each ad unit.

---

## 9. Local .env.local

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in every value. Here is the required set to get the app running:

```bash
# --- REQUIRED ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NICERELLA_ADMIN_SECRET=<generate-a-random-32-char-string>

# --- AT LEAST ONE AI KEY (used by analysis pipeline) ---
GEMINI_API_KEY=AIza...

# --- Oxylabs (optional for scraping, required if you want to scrape) ---
OXY_WSA_USERNAME=
OXY_WSA_PASSWORD=

# --- Optional but recommended ---
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_API_KEY=phx_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Generate a random admin secret:**
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

**Important:** Never commit `.env.local`. It is listed in `.gitignore`.

---

## 10. Apply Database Schema

### 10.1 Run the base schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Copy the entire contents of `supabase/schema.sql` from the repo.
5. Paste into the SQL Editor and click **Run**.
6. Verify all tables appear under **Table Editor**:
   - `sources`
   - `products`
   - `reviews`
   - `product_trust_analyses`
   - `logs`
   - `oxylabs_schedules`
   - `oxylabs_schedule_runs`
   - `subscriptions`

### 10.2 Enable pgvector

**Only do this if you want "similar products" on the details page.** If you skip this step, the details page still works but will show no similar products.

1. In Supabase SQL Editor, run `supabase/schema_pgvector.sql`.
2. Verify the `vector` extension is installed:
   ```sql
   select extname from pg_extension where extname = 'vector';
   ```
   Should return `vector`.
3. Verify the `embedding` column exists on `product_trust_analyses`:
   ```sql
   select column_name from information_schema.columns
     where table_name = 'product_trust_analyses' and column_name = 'embedding';
   ```

### 10.3 Verify RLS

Run this query to confirm row-level security is enabled on all tables:
```sql
select relname, relrowsecurity from pg_class
  where relname in ('sources','products','reviews','product_trust_analyses','logs','oxylabs_schedules','oxylabs_schedule_runs','subscriptions');
```
All rows should show `relrowsecurity = true`.

---

## 11. Seed Demo Data (optional)

If you want sample products to appear on the homepage immediately:

1. In Supabase SQL Editor, copy and run `supabase/seed-demo.sql`.
2. This inserts 3–5 demo sources and products with mock reviews and analyses.
3. Verify under **Table Editor → products** that rows appeared.

**For production, you will add real sources via the admin API (Step 16) and scrape them.**

---

## 12. Verify Locally

```bash
npm install
npm run dev
```

1. Open `http://localhost:3000`.
2. You should see the home page with the hero and any seeded products.
3. Sign up with a test email via Clerk.
4. Navigate to a product detail page (`/products/<id>`) and verify:
   - Trust meter renders
   - Sentiment chart renders
   - Pro-gated sections show the gate for free users
5. Run a manual scrape (if Oxylabs keys are set):
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "x-nicerella-admin-secret: 9b1deb4d3b35c26531c394f1cc621e25e1a14a06" \
     -H "Content-Type: application/json"
   ```
6. Watch the terminal for pipeline logs.

---

## 13. Vercel Deployment

### 13.1 Connect GitHub

1. Go to [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New... → Project**.
3. Under **Git Repository**, find and select your `nicerella` repository.
4. Click **Import**.

### 13.2 Configure project

On the **Configure Project** screen:

| Field | Value |
|---|---|
| Framework Preset | `Next.js` (auto-detected) |
| Build Command | (leave blank — uses default) |
| Output Directory | (leave blank — uses default) |
| Install Command | `npm ci` |

### 13.3 Add Environment Variables

Click **Environment Variables** and add every variable from your `.env.local`. Copy them exactly (no quotes around the values in the Vercel UI). Required variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NICERELLA_ADMIN_SECRET
GEMINI_API_KEY          # or whichever AI key you chose
OXY_WSA_USERNAME
OXY_WSA_PASSWORD
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
POSTHOG_API_KEY
NEXT_PUBLIC_SITE_URL    # set to your final domain (e.g. https://nicerella.vercel.app)
```

**Optional** (fill later or leave blank):
```
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_ENTERPRISE_MONTHLY
STRIPE_PRICE_ENTERPRISE_YEARLY
NEXT_PUBLIC_ADSENSE_CLIENT_ID
NEXT_PUBLIC_ADSENSE_SLOT_HOME
NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE
CEREBRAS_API_KEY
GROQ_API_KEY
HUGGINGFACE_API_KEY
MISTRAL_API_KEY
```

### 13.4 Deploy

1. Click **Deploy**.
2. Wait for the build to complete (usually 2–5 minutes).
3. Once deployed, Vercel gives you a URL like `https://nicerella-<branch>.vercel.app`.
4. Click **Visit** to open the live site.

### 13.5 Update Clerk allowed URLs

1. Go back to [Clerk Dashboard](https://dashboard.clerk.com) → your application.
2. Go to **URL Settings**.
3. Add your Vercel URL (e.g. `https://nicerella-<branch>.vercel.app`).
4. Add your production domain if you have one.
5. Click **Save**.

### 13.6 (Optional) Custom domain

1. In Vercel, go to your project **Settings → Domains**.
2. Add your domain (e.g. `nicerella.com`).
3. Follow the DNS instructions (add a CNAME or A record with your registrar).
4. Once DNS propagates, update Clerk's allowed URLs with the custom domain.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to the custom domain.

---

## 14. Configure Vercel Cron

The Vercel Cron configuration lives in `vercel.json` (already committed to the repo):

```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "0 12 * * *"
    }
  ]
}
```

This fires the pipeline every day at 12:00 UTC. No additional Vercel UI configuration is needed — Vercel reads this file automatically.

**To change the schedule**, edit `vercel.json` and commit to the connected branch. The change deploys automatically.

**The cron route is protected by `CRON_SECRET`, which Vercel injects automatically.** No additional env var is needed.

---

## 15. Stripe Webhook Configuration

After deploying to production:

1. Copy your production Vercel URL (e.g. `https://nicerella.vercel.app`).
2. In [Stripe Dashboard](https://dashboard.stripe.com), go to **Developers → Webhooks**.
3. Click **Add endpoint**.
4. Set **Endpoint URL** to: `https://nicerella.vercel.app/api/stripe/webhook`
5. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**.
7. Copy the **Webhook signing secret** (starts with `whsec_...`).
8. Go to Vercel → your project → **Settings → Environment Variables**.
9. Add `STRIPE_WEBHOOK_SECRET` with the copied value.
10. Click **Deploy** to push the env change.

---

## 16. Oxylabs Schedule Sync (one-time)

Before the automatic pipeline can run, you must add sources to Supabase and sync them with Oxylabs.

### 16.1 Add sources to Supabase

In Supabase SQL Editor, insert your e-commerce sources:

```sql
insert into public.sources (name, listing_url, active)
values
  ('Amazon Electronics', 'https://www.amazon.com/s?k=electronics&i=electronics', true),
  ('Best Buy Electronics', 'https://www.bestbuy.com/site/electronics/cat0000000.c?id=abcat0500000', true);
```

**Note:** Use listing/category entry pages only — not individual product URLs.

### 16.2 Sync Oxylabs schedules

After sources exist in Supabase, run the schedule sync once:

```bash
curl -X POST https://<your-production-url>/api/oxylabs/schedules \
  -H "x-nicerella-admin-secret: <your-NICERELLA_ADMIN_SECRET>" \
  -H "Content-Type: application/json"
```

This will:
1. Create (or update) an Oxylabs schedule for each active source.
2. Deactivate any orphaned Oxylabs schedules no longer in Supabase.
3. Store the Oxylabs `schedule_id` (as a text string — never parsed as a number) in `oxylabs_schedules`.

**Verify** in Supabase Table Editor → `oxylabs_schedules` that rows exist with non-empty `oxylabs_schedule_id`.

### 16.3 Trigger the first automatic run

The cron runs daily at 12:00 UTC. To test immediately, trigger the pipeline manually:

```bash
curl -X POST https://<your-production-url>/api/oxylabs/scheduled-results/process \
  -H "x-nicerella-admin-secret: <your-NICERELLA_ADMIN_SECRET>" \
  -H "Content-Type: application/json"
```

This fetches any completed Oxylabs runs, runs the scrape-to-insert pipeline, and then triggers AI analysis on any new or unanalyzed products.

---

## 17. Run a Manual Scrape

To scrape and populate products manually (bypasses scheduler):

```bash
curl -X POST https://<your-production-url>/api/scrape \
  -H "x-nicerella-admin-secret: <your-NICERELLA_ADMIN_SECRET>" \
  -H "Content-Type: application/json"
```

This runs the full scrape-to-insert pipeline (AGENTS.md section 9):
1. Fetches live listing HTML from each active source via Oxylabs.
2. Extracts candidate product links.
3. Scrapes product detail pages.
4. Validates and inserts products and reviews.
5. Emits a run summary to the terminal and to the `logs` table.

**Expected response (summary):**
```json
{
  "status": "completed",
  "sources_checked": 2,
  "candidates_found": 47,
  "candidates_rejected": 12,
  "duplicates_skipped": 5,
  "detail_pages_scraped": 30,
  "products_inserted": 8,
  "reviews_inserted": 64,
  "products_rejected": 3,
  "products_failed": 1,
  "total_duration_ms": 48230,
  "rejection_reasons": { "no_reviews": 3, "no_image": 1 }
}
```

---

## 18. Post-Deploy Smoke Tests

Run these commands against your production URL to verify everything works end-to-end.

### 18.1 Home page loads

```bash
curl -s -o /dev/null -w "%{http_code}" https://<your-production-url>/
# Expected: 200
```

### 18.2 Products API returns data

```bash
curl -s https://<your-production-url>/api/products | head -c 200
# Expected: JSON array or "[]"
```

### 18.3 Manual scrape works

```bash
curl -X POST https://<your-production-url>/api/scrape \
  -H "x-nicerella-admin-secret: <your-NICERELLA_ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  | jq .
# Expected: summary object with products_inserted > 0
```

### 18.4 AI analysis runs on a product

```bash
# Get a product ID from the previous scrape response, then:
curl -X POST https://<your-production-url>/api/analyze \
  -H "x-nicerella-admin-secret: <your-NICERELLA_ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"<PRODUCT_ID>"}' \
  | jq .
# Expected: analysis object with trust_score, trust_label, etc.
```

### 18.5 Product detail page renders

```bash
curl -s https://<your-production-url>/products/<PRODUCT_ID> | grep -o 'trust score' | head -1
# Expected: "trust score" (page contains analysis data)
```

### 18.6 Sign-in works

1. Open the production URL in a browser.
2. Click **Sign In** → enter a test email.
3. Verify the Clerk sign-in modal appears and completes.
4. Verify the header shows your email after sign-in.

### 18.7 Pro gate works

1. Sign in as a free user.
2. Navigate to a product detail page.
3. Scroll past the trust meter — the sentiment chart and red flags section should show a Pro gate (upgrade prompt).
4. Navigate to the billing page (`/billing`) and verify the pricing table renders.

---

## 19. Known Deferred Improvements

These items were identified during audit but deferred to a later release. They do not block launch:

| ID | Improvement | File(s) |
|---|---|---|
| M2 | Remove `unoptimized` from `next/image` and add `remotePatterns` to `next.config` for product image CDN | `next.config.js`, `app/products/[id]/page.tsx` |
| M4 | Lazy-load PostHog SDK to reduce initial bundle size | `app/providers.tsx`, `lib/posthog/client.ts` |
| — | Add unit/integration tests for the pipeline | `tests/` |
| — | Set up Sentry for production error tracking | `lib/sentry.ts` |

---

## 20. Rollback

If a deployment introduces a regression:

### 20.1 Roll back via Vercel

1. Go to [Vercel Dashboard](https://vercel.com) → your project.
2. Click **Deployments**.
3. Find the last known-good deployment (green checkmark).
4. Click the **⋯** menu → **Rollback**.
5. Vercel re-deploys that commit instantly.

### 20.2 Roll back database changes

If a schema migration caused data corruption:

1. In Supabase Dashboard, go to **SQL Editor**.
2. Run the inverse of the migration (e.g. `drop table public.some_table;`).
3. Restore from a Supabase backup if available (**Settings → Backup**).

### 20.3 Roll back environment variables

1. In Vercel → your project → **Settings → Environment Variables**.
2. Change any variable back to its previous value.
3. Trigger a new deploy (**Deployments → Redeploy**).

---

## Quick Reference: All Environment Variables

| Variable | Required | Source |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | ✅ | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Dashboard → Settings → API → Service Role |
| `NICERELLA_ADMIN_SECRET` | ✅ | Generate randomly (see Step 9) |
| `GEMINI_API_KEY` | ⚠️ at least one AI key | [AI Studio](https://aistudio.google.com/app/apikey) |
| `OXY_WSA_USERNAME` | ⚠️ for scraping | [Oxylabs Dashboard](https://user.oxylabs.io) |
| `OXY_WSA_PASSWORD` | ⚠️ for scraping | [Oxylabs Dashboard](https://user.oxylabs.io) |
| `STRIPE_SECRET_KEY` | ⚠️ for billing | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ for billing | Stripe Dashboard → Developers → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ for billing | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⚠️ for analytics | PostHog Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | ⚠️ for analytics | PostHog Project Settings |
| `POSTHOG_API_KEY` | ⚠️ for analytics | PostHog Project Settings → Ingestion |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ for metadata | Your production domain |
| `CEREBRAS_API_KEY` | ❌ | [Cerebras Cloud](https://cloud.cerebras.ai) |
| `GROQ_API_KEY` | ❌ | [Groq Console](https://console.groq.com/keys) |
| `MISTRAL_API_KEY` | ❌ | [Mistral Console](https://console.mistral.ai/api-keys) |
| `HUGGINGFACE_API_KEY` | ❌ | [Hugging Face Settings](https://huggingface.co/settings/tokens) |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | ❌ | Google AdSense |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | ❌ | Google AdSense |
| `STRIPE_PRICE_PRO_MONTHLY` | ❌ | Stripe Dashboard (lookup key only) |
| `STRIPE_PRICE_PRO_YEARLY` | ❌ | Stripe Dashboard (lookup key only) |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | ❌ | Stripe Dashboard (lookup key only) |
| `STRIPE_PRICE_ENTERPRISE_YEARLY` | ❌ | Stripe Dashboard (lookup key only) |

---

## Checklist — Pre-Launch Verification

Before announcing launch, confirm every item:

- [ ] Home page loads on production URL (curl returns 200)
- [ ] Clerk sign-in / sign-up works end-to-end
- [ ] Product cards display trust score badges
- [ ] Product detail page shows analysis (trust meter, sentiment, red flags)
- [ ] Pro gate blocks free users from full analysis view
- [ ] Manual scrape (`POST /api/scrape`) inserts products and reviews
- [ ] Manual analysis (`POST /api/analyze`) computes trust score
- [ ] Stripe checkout flow works in test mode
- [ ] Stripe webhook fires and subscription record is created
- [ ] Oxylabs schedules are synced (`GET /api/oxylabs/schedules`)
- [ ] Vercel Cron is wired (`vercel.json` exists and is committed)
- [ ] All required env vars are set in Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` points to production domain
- [ ] Clerk allowed URLs include production domain
- [ ] pgvector extension is enabled (if "similar products" is desired)
- [ ] No `console.log` statements in production code
- [ ] No hardcoded secrets in source files
- [ ] RLS is enabled on all tables (verified via SQL query in Step 10.3)
- [ ] Backup strategy in place (Supabase automatic backups enabled)

---

*Guide last updated: 2026-08-09. Follows Nicerella AGENTS.md v1.0 and the production-launch audit findings.*
