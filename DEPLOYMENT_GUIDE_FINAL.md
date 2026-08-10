# Nicerella — Final Deployment Guide (Production)

> **Purpose:** get the current app (production-ready fixes already done) from this repo to **Vercel**.
> This is the **final** guide. All account creation is already complete — Supabase, Clerk, Oxylabs,
> Stripe, PostHog, AI providers (Gemini/Groq/Cerebras/Mistral) — so those steps are **skipped** here.
> You only do: local build → git push → Vercel project + env → deploy → post-deploy swaps.

Time to do this once: **~20 minutes** (plus AdSense approval wait time, which is external).

---

## 0. What's already done (DO NOT redo)

| Platform | Status | Notes |
|---|---|---|
| Supabase | ✅ Done | Project + schema applied, products already analyzed in DB |
| Clerk | ✅ Test instance | Test keys in `.env.local` — swap to production instance later (step 7.2) |
| Oxylabs | ✅ Done | Credentials in `.env.local` |
| Stripe | ✅ Test mode | Test keys in `.env.local` — swap to live later (step 7.3) |
| PostHog | ✅ Done | Keys in `.env.local` |
| Gemini / Groq / Cerebras / Mistral | ✅ Done | All 4 AI keys in `.env.local` |
| Google AdSense | ⏳ Approved? | Real ad unit values NOT yet added — placeholders until approval (step 7.1) |
| `vercel.json` cron | ✅ Configured | Runs `/api/cron/pipeline` daily at 12:00 UTC — nothing to change |

---

## 1. Env vars — status of every value in `.env.local`

Your `.env.local` is **gitignored** (never pushed — safe). This table tells you exactly what to
copy to Vercel and what to change. **Do not copy secrets into this guide/repo — keep them in Vercel
Project → Settings → Environment Variables.**

### 1A. ✅ Already done — copy these to Vercel exactly as they are

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ real value set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ real value set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ real value set (secret) |
| `GEMINI_API_KEY` | ✅ set |
| `GROQ_API_KEY` | ✅ set |
| `CEREBRAS_API_KEY` | ✅ set |
| `MISTRAL_API_KEY` | ✅ set |
| `OXY_WSA_USERNAME` | ✅ set |
| `OXY_WSA_PASSWORD` | ✅ set |
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ set |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ set |
| `POSTHOG_API_KEY` | ✅ set |

### 1B. ⚠️ Copy but CHANGE the value (do not paste the current one as-is)

| Variable | Current value | What to do on Vercel |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | **Set to your real domain**, e.g. `https://nicerella.com`. If you leave the localhost value, sitemap/OG/canonical all point at localhost. |
| `NICERELLA_ADMIN_SECRET` | a local dev value | Generate a **fresh strong value** for production. Command below. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | test key | Test key works now. Replace with **production instance** key later (step 7.2). |
| `CLERK_SECRET_KEY` | test key | Same as above. |
| `STRIPE_SECRET_KEY` | test key | Test mode works now. Swap to **live** key later (step 7.3). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | test key | Same as above. |
| `STRIPE_WEBHOOK_SECRET` | test webhook secret | Same as above. |

### 1C. ⏳ Placeholders — copy as-is now, replace after AdSense approval

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | placeholder `ca-pub-1234567890123456` — harmless, renders nothing until real value |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | placeholder — replace after approval |
| `NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT` | placeholder — replace after approval |
| `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES` | placeholder — replace after approval |
| `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE` | placeholder — replace after approval |

### 1D. 🆕 Create on Vercel (NOT in `.env.local`)

| Variable | Why |
|---|---|
| `CRON_SECRET` | Required by `/api/cron/pipeline`. Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` on every cron request. Without it the daily pipeline returns 401. Generate a strong value (command below). |

### 1E. ❌ Skip entirely

| Variable | Why |
|---|---|
| `HUGGINGFACE_API_KEY` | Empty locally. Only an optional last-resort AI fallback. Not needed. |

**Generate fresh secrets** (run in your terminal, then paste the outputs into Vercel):
```bash
openssl rand -hex 32    # paste into CRON_SECRET
openssl rand -hex 32    # paste into NICERELLA_ADMIN_SECRET
```

---

## 2. Local build check

Run from the repo root to confirm the app compiles before pushing:

```bash
npm run build
```

- **Success looks like:** all routes compiled, no type errors, `✓ Compiled successfully`.
- If you get an OOM kill (`exit 143`, `SIGTERM`) — that's this Codespace's low memory, **not** a code
  problem. Typecheck and lint already pass (`npx tsc --noEmit` → 0 errors, `npm run lint` → 0 errors),
  and Vercel runs its own build with plenty of memory. Proceed anyway.

---

## 3. Push to GitHub

`.env.local` is gitignored — **no secrets will be pushed.**

```bash
git add -A
git commit -m "final: production ready — fixes + admin product API"
git push origin main
```

(If you prefer a shorter message in your existing style: `Final: Production Ready`.)

---

## 4. Create the Vercel project & connect GitHub

1. Go to **vercel.com** → **Add New…** → **Project**.
2. Import the **nicerella** GitHub repo.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** leave default (`.`).
5. **Build Command:** leave default (`npm run build`).
6. Node version: use **22 LTS or 24** (the app is developed on Node 24).
7. Click **Environment Variables** → add every variable from **1A**, the changed ones from **1B**,
   the placeholders from **1C**, and the new ones from **1D** (set `CRON_SECRET` + fresh
   `NICERELLA_ADMIN_SECRET`).
8. Click **Deploy**. First build takes 2–4 minutes.

---

## 5. After the first successful deploy

1. Open the deployed URL. Check the homepage shows your **4 analyzed products** and there are
   **no console errors** (DevTools → Console).
2. Add your custom domain: **Project → Settings → Domains → Add** (e.g. `nicerella.com`), then set
   the DNS records Vercel shows (usually a CNAME or A record at your registrar).
3. Update `NEXT_PUBLIC_SITE_URL` in Vercel env to the final domain (if it differs from step 1B) →
   **Redeploy**.
4. Verify cron once: the daily job fires at 12:00 UTC. To test immediately, use
   **Settings → Cron Jobs** (or trigger `/api/cron/pipeline` with the `Authorization: Bearer <CRON_SECRET>`
   header) and confirm logs appear in **Project → Logs**.

---

## 6. Manual product add (when Oxylabs quota runs out)

No UI needed — the admin API route is ready. Add products in bulk with reviews, and they get
analyzed automatically:

```bash
curl -X POST https://<your-domain>/api/admin/products \
  -H "Content-Type: application/json" \
  -H "x-nicerella-admin-secret: <NICERELLA_ADMIN_SECRET>" \
  -d '{"products":[
    {
      "title":"Your Product Title",
      "original_url":"https://store.example.com/p/123",
      "image_url":"https://img.example.com/123.jpg",
      "price":49.99,
      "category":"electronics",
      "source_name":"Manual",
      "reviews":[
        {"rating":5,"text":"Great product, totally worth it."},
        {"rating":4,"text":"Good, shipping was a bit slow."}
      ]
    }
  ],"analyze":true}'
```

- Dedupes by `original_url` (re-posting the same product is skipped).
- Products need at least 1 review to get a trust score (products without reviews are stored but stay
  off the homepage until reviews are added).
- 200 products max per request — batch larger lists.

---

## 7. Post-launch swaps (do these after you're live)

### 7.1 Google AdSense
1. Submit the live site URL in AdSense → wait for approval (days–weeks).
2. Create ad units → copy the real `ca-pub-…` client ID + slot IDs.
3. Update `NEXT_PUBLIC_ADSENSE_CLIENT_ID` + the four `NEXT_PUBLIC_ADSENSE_SLOT_*` values on Vercel →
   **Redeploy**. Ads start showing.

### 7.2 Clerk production instance + Google OAuth
1. In Clerk Dashboard create a **production instance**; in **Google Cloud Console** create the OAuth
   client and grab the credentials.
2. Add Google OAuth provider in Clerk with those credentials.
3. Set the production domain under **Domains** (verification DNS record).
4. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` on Vercel to the **production**
   instance keys → **Redeploy**. (Development-instance warning in the console disappears.)

### 7.3 Stripe live mode
1. In Stripe enable **live mode**, create/reuse the Pro/Enterprise products and **Prices**, and set
   the live keys.
2. Optionally set `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`,
   `STRIPE_PRICE_ENTERPRISE_*` to your live price IDs.
3. Point the webhook endpoint to `https://<your-domain>/api/stripe/webhook` in live mode, copy the new
   `whsec_…`, and update the three `STRIPE_*` values on Vercel → **Redeploy**.
4. Run a small live test payment to confirm the subscription flow end-to-end.

---

## 8. Final checklist

- [ ] `npm run build` succeeded (or confirmed Vercel build succeeded)
- [ ] Pushed to GitHub with the final commit
- [ ] Vercel project imported + deployed
- [ ] All env vars from **1A–1D** set on Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` = real domain
- [ ] Custom domain added + DNS live
- [ ] Homepage shows products, no console errors
- [ ] Cron verified (logs appear, `CRON_SECRET` working)
- [ ] (Later) AdSense real values + redeploy
- [ ] (Later) Clerk production instance + Google OAuth
- [ ] (Later) Stripe live keys
