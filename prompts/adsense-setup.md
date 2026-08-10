# Connect Google AdSense to nicerella.vercel.app (click-by-click guide)

## Current state
- Code has AdSense slots on: home page, product page, articles index, article page
- `.env.local` has **placeholder IDs** → `adsenseConfigured()` returns `false` → no ads render
- AdSense dashboard: site `nicerella.vercel.app` shows "Requires review — Not found"

## What you must do in AdSense dashboard (https://adsense.google.com)

### Step 1: Get your real Publisher ID
1. Sign in to https://adsense.google.com
2. Top-right account avatar → **Payments** → **Payment info**
3. Your **Publisher ID** is shown as `ca-pub-XXXXXXXXXXXXXXXX` (16 digits after `ca-pub-`)
4. **Copy this exact string** — this is your real `NEXT_PUBLIC_ADSENSE_CLIENT_ID`

### Step 2: Create ad units (one per placement)
For each of these 4 placements, create a separate ad unit:

| Placement | AdSense name suggestion | Ad unit type |
|-----------|------------------------|--------------|
| Home below grid | `nicerella_home_below_grid` | Display ads → Responsive |
| Product below hero | `nicerella_product_below_hero` | Display ads → Responsive |
| Articles index | `nicerella_articles_index` | Display ads → Responsive |
| Article bottom | `nicerella_article_bottom` | Display ads → Responsive |

**Click-by-click for each:**
1. Left nav → **Ads** → **By ad unit** → **Display ads**
2. Name it (e.g. `nicerella_home_below_grid`)
3. **Ad size** → **Responsive** (recommended)
4. **Save** → AdSense shows a code snippet like:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   ```
5. **Copy the `data-ad-slot` number only** (e.g. `1234567890`) — this is your real slot ID
6. Repeat for all 4 placements

### Step 3: Add site for review (if not already)
1. Left nav → **Sites** → **Add site**
2. Enter `nicerella.vercel.app` → **Save**
3. AdSense will show "Getting ready" → "Requires review" → "Ready" (can take days)
4. The review checks that the AdSense script loads on your pages — so you must deploy with real IDs first

---

## Files to update (exact changes)

### 1. `.env.local` (local dev)
```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-YOUR_REAL_16_DIGIT_ID
NEXT_PUBLIC_ADSENSE_SLOT_HOME=YOUR_REAL_SLOT_1
NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT=YOUR_REAL_SLOT_2
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLES=YOUR_REAL_SLOT_3
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE=YOUR_REAL_SLOT_4
```

### 2. Vercel → Settings → Environment Variables (production)
Add/update the **same 5 variables** for **Production** (and Preview if you want). Then **Redeploy**.

---

## Verification checklist (after deploy)

1. **Local:** `npm run dev` → visit home page → inspect `<ins class="adsbygoogle">` in DevTools → `data-ad-client` matches your real ca-pub ID
2. **Production:** Visit `https://nicerella.vercel.app/` → same check
3. **AdSense dashboard** → Sites → `nicerella.vercel.app` should eventually show "Ready" (can take 1–14 days)
4. **Ads appear:** Once "Ready", real ads will fill the 4 slots (may take a few hours after approval)

---

## What the code already handles (no changes needed)

- `lib/ads/env.ts`: blocks placeholder IDs automatically
- `components/ads/ad-slot.tsx`: renders `<ins>` + fires `adsbygoogle.push({})` once per slot
- `app/layout.tsx`: loads `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=...` only when configured
- 4 slots placed in pages:
  - Home: `AD_SLOTS.homeBelowGrid` (below product grid)
  - Product: `AD_SLOTS.productBelowHero` (below hero, above analysis)
  - Articles index: `AD_SLOTS.articlesIndex` (below article list)
  - Article page: `AD_SLOTS.articleBottom` (after key takeaways, before CTA)

---

## Manual test commands

```bash
# 1. Update .env.local with your real IDs
# 2. Restart dev server
npm run dev

# 3. Verify in browser console
# Visit http://localhost:3000/ → F12 → Elements → search "adsbygoogle"
# Should see <ins data-ad-client="ca-pub-YOUR_REAL_ID" ...>

# 4. Deploy
git add .env.local && git commit -m "AdSense: real publisher ID + ad unit slots" && git push

# 5. Update Vercel env vars (5 vars) → Redeploy
```

---

## Common pitfalls to avoid

| Mistake | Result |
|---------|--------|
| Using the same slot ID for multiple placements | AdSense reports impressions incorrectly |
| Keeping placeholder IDs in Vercel | No ads on production, site stays "Not found" |
| Forgetting `data-ad-format="auto"` | Fixed-size ads may overflow on mobile |
| Not waiting for "Ready" status | No ads served even if code is correct |

---

## Auto ads (optional, per your screenshot)

If you enable **Auto ads** in AdSense dashboard (Ads → By site → Auto ads), Google will place additional ads automatically. The existing manual slots will still work. No code changes needed — just toggle in AdSense UI.