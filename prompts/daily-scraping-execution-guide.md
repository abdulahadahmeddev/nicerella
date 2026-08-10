# DAILY SCRAPING + ANALYSIS — CLICK-BY-CLICK EXECUTION GUIDE

**Generated:** 2026-08-10 | **For:** nicerella.vercel.app | **Status:** All code deployed, needs sources + cron

---

## 📋 PREREQUISITES (verify once)

| Item | Check |
|------|-------|
| Vercel Production env vars set | ✅ `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, all AdSense, PostHog, Stripe, Oxylabs, Supabase |
| Vercel redeployed after env changes | ✅ |
| `vercel.json` with cron pushed | ⚠️ **DO THIS AFTER PHASE 3** |
| Dev server running locally | `npm run dev` on `http://localhost:3000` |
| Supabase project accessible | Dashboard → SQL Editor |
| Oxylabs credentials in `.env.local` | `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD` |

---

## 🔐 YOUR ADMIN SECRET (copy once)

```bash
# Run this in terminal to set for all commands below
export ADMIN_SECRET=$(grep NICERELLA_ADMIN_SECRET .env.local | cut -d= -f2)
export SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)
export SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)
```

---

## PHASE 0: ADD REAL SOURCES (one-time, 5 min)

### Step 0.1: Open Supabase Dashboard
1. Go to **https://supabase.com/dashboard**
2. Click your project: **pumpajgyefvtvbjwyvdd**
3. Left sidebar → **SQL Editor** → **New query**

### Step 0.2: Paste and Run This SQL
```sql
-- Replace these with YOUR actual target categories
INSERT INTO sources (name, listing_url, parser_strategy, active)
VALUES
  ('Amazon Wireless Headphones', 'https://www.amazon.com/s?k=wireless+headphones', 'amazon', true),
  ('Amazon Laptops', 'https://www.amazon.com/s?k=laptop', 'amazon', true),
  ('Amazon Smartphones', 'https://www.amazon.com/s?k=smartphone', 'amazon', true),
  ('Amazon Smart Watches', 'https://www.amazon.com/s?k=smartwatch', 'amazon', true),
  ('Amazon Tablets', 'https://www.amazon.com/s?k=tablet', 'amazon', true)
ON CONFLICT (listing_url) DO UPDATE SET active = true, name = EXCLUDED.name;
```

### Step 0.3: Click **"Run"** (Ctrl+Enter)
- ✅ Success: "5 rows inserted" or "5 rows updated"
- Verify: **Table Editor** → `sources` → all 5 show `active = true`

---

## PHASE 1: MANUAL SCRAPE NOW (2 min — immediate products)

### Step 1.1: Ensure Dev Server Running
```bash
# Terminal 1
npm run dev
# Wait for "Ready in xxx ms" and "Local: http://localhost:3000"
```

### Step 1.2: Trigger Scrape (Terminal 2)
```bash
# Paste this entire block and press Enter
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" \
  -d '{"limitPerSource": 5}' | jq .
```

### Step 1.3: Watch Terminal 1 (logs)
You'll see live logs like:
```
scrape started
selected sources: 5
source "Amazon Wireless Headphones": listing fetched
candidate links found: 12
candidates rejected before detail scrape: 3
duplicates skipped: 0
detail pages scraped: 5
products inserted: 5
reviews inserted: 47
products rejected after validation: 0
scrape completed: {status: "completed", products_inserted: 5, ...}
```

### Step 1.4: Verify in Supabase
1. Dashboard → **Table Editor** → `products`
2. Should see 15–25 new rows (5 sources × ~5 products)
3. Check `analyzed_at` = `null` (not yet analyzed)

---

## PHASE 2: MANUAL ANALYSIS NOW (1 min — trust scores + embeddings)

### Step 2.1: Trigger Analysis
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" \
  -d '{"limit": 50}' | jq .
```

### Step 2.2: Watch Terminal 1 (logs)
```
analysis started
products pending: 23
provider: gemini
product "Sony WH-1000XM5..." analyzed: trust_score=0.92, label="highly trustworthy"
product "Apple AirPods Pro..." analyzed: trust_score=0.78, label="mostly trustworthy"
...
analysis completed: {products_analyzed: 23, providers_used: ["gemini"], ...}
```

### Step 2.3: Verify in Supabase
1. **Table Editor** → `products` → `analyzed_at` now has timestamps
2. **Table Editor** → `product_trust_analyses` → 23 rows with `trust_score`, `trust_label`, `embedding`

---

## PHASE 3: OXYLABS SCHEDULER SETUP (one-time, 2 min)

### Step 3.1: Sync Schedules to Oxylabs
```bash
curl -X POST http://localhost:3000/api/oxylabs/schedules \
  -H "Content-Type: application/json" \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" \
  -d '{"cron": "0 2 * * *"}' | jq .
```

**Expected response:**
```json
{
  "created": 5,
  "deactivated": 0,
  "schedules": [
    {"source_id": "...", "oxylabs_schedule_id": "1234567890123456789"},
    ...
  ]
}
```

### Step 3.2: Verify in Oxylabs Dashboard
1. Go to **https://developers.oxylabs.io** → **Web Scraper API** → **Scheduler**
2. You should see **5 schedules** with your cron `0 2 * * *` (2 AM UTC daily)
3. Each schedule's **Target URL** = your source `listing_url`

---

## PHASE 4: ADD VERCEL CRON CONFIG (one-time, 1 min)

### Step 4.1: Create `vercel.json` in Repo Root
**File:** `/workspaces/nicerella/vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/pipeline",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Step 4.2: Commit & Push
```bash
git add vercel.json
git commit -m "Add Vercel Cron for daily pipeline (4 AM UTC)"
git push origin main
```

### Step 4.3: Verify Deploy
1. Go to **Vercel Dashboard** → your project → **Deployments**
2. Wait for new deployment (green checkmark)
3. Go to **Settings** → **Cron Jobs** → should show `/api/cron/pipeline` scheduled daily 4 AM UTC

---

## PHASE 5: TEST SCHEDULED PROCESSING (manual, after first Oxylabs run)

### Step 5.1: Wait for First Oxylabs Run
- Oxylabs runs at **2 AM UTC** (your cron)
- Check **Oxylabs Dashboard** → Scheduler → your schedules → **Runs**
- Wait for status = **"done"** (green checkmark)

### Step 5.2: Process Results Manually (first time only)
```bash
curl -X POST http://localhost:3000/api/oxylabs/scheduled-results/process \
  -H "Content-Type: application/json" \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" | jq .
```

**Expected:** Same pipeline summary as Phase 1, but from scheduled HTML.

---

## PHASE 6: DAILY AUTOMATIC OPERATION (forever after Phase 4)

| Time (UTC) | Automated Action |
|------------|------------------|
| **02:00** | Oxylabs Scheduler scrapes all 5 source listing pages |
| **04:00** | Vercel Cron fires `/api/cron/pipeline` → **Step 1**: process completed runs → scrape detail pages + insert products/reviews → **Step 2**: analyze all pending products |
| **All day** | Home page shows fresh products with trust scores |

---

## 🔍 DAILY VERIFICATION COMMANDS (run anytime)

### Check Active Sources
```bash
curl -s -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/sources?select=id,name,listing_url,active&active=eq.true" | jq .
```

### Count Products + Analysis Status
```bash
curl -s -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/products?select=id,title,source_id,analyzed_at,created_at&order=created_at.desc&limit=20" | jq .
```

### View Recent Pipeline Logs
```bash
curl -s -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/logs?select=level,source,message,details,created_at&order=created_at.desc&limit=30" | jq .
```

### Check Oxylabs Schedules (via API)
```bash
curl -X GET http://localhost:3000/api/oxylabs/schedules \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" | jq .
```

### Check Schedule Runs (last 24h)
```bash
# Get schedule IDs first, then for each:
curl -X GET "http://localhost:3000/api/oxylabs/schedules" \
  -H "x-nicerella-admin-secret: $ADMIN_SECRET" | jq -r '.schedules[].oxylabs_schedule_id'
# Then check runs for each (manual in Oxylabs Dashboard is easier)
```

---

## 🎯 QUICK TEST CHECKLIST (after full setup)

| Test | Command / Action | Expected |
|------|------------------|----------|
| **1. Sources active** | Supabase → `sources` table | 5 rows, `active=true` |
| **2. Scrape works** | Run Phase 1 curl | `products_inserted > 0` |
| **3. Analysis works** | Run Phase 2 curl | `products_analyzed > 0` |
| **4. Trust scores visible** | Visit `http://localhost:3000/` | Product cards show trust badges |
| **5. Product detail works** | Click a product card | Full analysis, sentiment, red flags |
| **6. Oxylabs schedules created** | Oxylabs Dashboard → Scheduler | 5 schedules, cron `0 2 * * *` |
| **7. Vercel cron registered** | Vercel → Settings → Cron Jobs | `/api/cron/pipeline` at `0 4 * * *` |
| **8. Ads.txt accessible** | `https://nicerella.vercel.app/ads.txt` | Returns publisher line |
| **9. AdSense script loads** | DevTools → Network → `adsbygoogle.js` | 200 OK, correct client ID |
| **10. PostHog events** | PostHog → Live Events | Pageviews, clicks tracked |

---

## 🚨 TROUBLESHOOTING QUICK REFERENCE

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `401 Unauthorized` on API calls | Wrong admin secret | `echo $ADMIN_SECRET` matches `.env.local` |
| `0 products inserted` | No active sources | Phase 0: add sources with `active=true` |
| `0 products analyzed` | No products with reviews | Scrape first, then analyze |
| Oxylabs schedule not created | Wrong credentials | Check `OXY_WSA_USERNAME/PASSWORD` in `.env.local` |
| Vercel cron not firing | `CRON_SECRET` missing | Add to Vercel env vars, redeploy |
| `ads.txt` 404 | Not deployed | Push `public/ads.txt`, wait for deploy |
| AdSense script not loading | `NEXT_PUBLIC_ADSENSE_CLIENT_ID` placeholder | Verify Vercel env has real `ca-pub-...` |

---

## 📅 RECURRING MAINTENANCE

| Frequency | Action |
|-----------|--------|
| **Daily** | Check logs (Phase 6 auto-runs) |
| **Weekly** | Review Oxylabs usage/billing in Dashboard |
| **Monthly** | Add new source categories in Supabase |
| **Quarterly** | Rotate `NICERELLA_ADMIN_SECRET`, `CRON_SECRET` |
| **As needed** | Increase `limitPerSource` in scrape calls |

---

## 📞 SUPPORT LINKS

- **Supabase Dashboard:** https://supabase.com/dashboard/project/pumpajgyefvtvbjwyvdd
- **Vercel Dashboard:** https://vercel.com/abdulahadahmeddev/nicerella
- **Oxylabs Dashboard:** https://developers.oxylabs.io
- **AdSense Dashboard:** https://adsense.google.com
- **PostHog Dashboard:** https://us.i.posthog.com
- **Stripe Dashboard:** https://dashboard.stripe.com

---

**Save this file as:** `prompts/daily-scraping-execution-guide.md`  
**Run Phase 0 → 1 → 2 → 3 → 4 in order.** After Phase 4, everything runs automatically forever.