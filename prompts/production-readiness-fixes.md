# Production-Readiness Fixes — Nicerella SaaS MVP

## Goal

Make nicerella production-ready as a shipping SaaS MVP: fix every verified build/lint bug, resolve the AdSense placeholder issue so no broken ad requests fire before real approval, align the Free-tier pricing copy with actual Pro-gating behavior, and add an admin-protected manual product-add API route so the owner can bulk-insert 200–1000+ products with reviews and auto-analyze them. The AI chat stack (recently added) is the source of most verified bugs and is a focus of this pass.

## Skills and MCPs read/used

- `.agents/skills/ai-sdk` — for the AI SDK v7 API surface (`generateText` options, `LanguageModel` type).
- `.agents/skills/ui-ux-pro-max` — for the pricing-copy and ad-slot changes (visual/interaction decisions).
- `chrome-devtools-mcp` / `playwright-mcp` — verification only (dev-time), used per AGENTS.md §21 for the UI-touching fixes. **Note:** chrome-devtools-mcp is currently unavailable in this environment (missing X server); verification is done via playwright-mcp and reported.

## Existing code inspected

- `lib/ai/chat-providers.ts` — imports `LanguageModelV1` (not exported in AI SDK v7), uses `require("@ai-sdk/openai")` (forbidden import style), unused `requireEnv`, `maxTokens` option (renamed to `maxOutputTokens`).
- `app/products/[id]/page.tsx` — passes `analysis?.redFlags` (`RedFlag[]`, objects) into `ChatContext.redFlags` (`string[]`); type mismatch AND a runtime bug (the prompt builder `.join(", ")` would render `[object Object]`).
- `components/chat/chat-widget.tsx` — `setState` inside a mount effect (react-hooks/set-state-in-effect lint error).
- `lib/ads/env.ts` + `components/ads/ad-slot.tsx` + `app/layout.tsx` — placeholder `ca-pub-1234567890123456` (and placeholder slot ids) are treated as "configured", so the loader script and `ins` units render and fire 400s against Google.
- `lib/stripe/plans.ts` — Free plan advertises "5 detailed trust analyses per month" but the app is Pro-only for full analyses (server-side `ProGate`). Mismatch to fix on the copy side (user's decision).
- `lib/data/products.ts` (`insertProducts`, `findExistingUrls`), `lib/data/reviews.ts` (`insertReviews`), `lib/data/sources.ts` (`listSources`, `upsertSource`), `lib/data/analyses.ts` (`listPendingAnalysisProducts`), `lib/pipeline/analyze.ts` (`runAnalysisPipeline`) — data-layer building blocks reused by the new admin route.
- `app/api/scrape/route.ts`, `app/api/analyze/route.ts`, `app/api/cron/pipeline/route.ts` — existing route conventions (admin secret, rate limiting, `revalidateTag("products", "max")`).
- `lib/api/admin-secret.ts`, `lib/api/rate-limit.ts` — shared guards to reuse.

## Decisions or assumptions

1. Manual product addition is a **new admin API route** (`POST /api/admin/products`), admin-secret protected (AGENTS.md §15). No admin UI is built in this pass — the owner scripts/bulk-posts JSON. (User's choice.)
2. Free tier stays **Pro-only for full analyses**; pricing copy is corrected to match reality. No 5/month quota system. (User's choice.)
3. AI chat widget stays **product-detail-pages only** — no global chat. (User's choice.)
4. Manual products must carry at least one review to receive a trust analysis (the analysis pipeline skips review-less products — that existing behavior is preserved and surfaced in the route's response).
5. Manual adds never pollute the scraping sources: if a matching source is not passed/provided, a source named as requested (default `Manual`) is created with `active: false` so the scrape pipeline (AGENTS.md §8/§9) never picks it up.
6. The AdSense placeholder values (client `ca-pub-1234567890123456` and slot ids `1234567890`-style) count as "not configured" so zero ad code renders/fires until the owner adds real values on Vercel and redeploys.

## Files likely to change

- `lib/ai/chat-providers.ts` (bug fixes)
- `app/products/[id]/page.tsx` (redFlags mapping)
- `components/chat/chat-widget.tsx` (lazy state init)
- `lib/ads/env.ts` (placeholder detection)
- `components/ads/ad-slot.tsx` (skip placeholder slots defensively)
- `lib/stripe/plans.ts` (Free plan feature copy)
- **New:** `app/api/admin/products/route.ts` (manual product add + auto-analyze)
- Possibly `supabase/types.ts` if any new column/types are needed (aim: none).

## Implementation requirements

### 1. `lib/ai/chat-providers.ts` — fix all TS + lint errors

- Import `LanguageModel` (not `LanguageModelV1`) as the `LanguageModelV1` type alias — or type `model: LanguageModel` directly.
- Replace `const { createOpenAI } = require("@ai-sdk/openai");` with a top-level static `import { createOpenAI } from "@ai-sdk/openai";` (already a direct dependency).
- Remove the unused `requireEnv` import.
- Rename `maxTokens: 500` → `maxOutputTokens: 500` (AI SDK v7 API).
- Keep the multi-provider failover order and `instructions` usage unchanged.

### 2. `app/products/[id]/page.tsx` — fix ChatContext redFlags

- Map `analysis?.redFlags` (`RedFlag[]`) to `string[]` of **descriptions** before passing to `ChatWidget` context so the AI prompt renders real red-flag text, e.g. `redFlags: analysis?.redFlags.map((f) => f.description)`.

### 3. `components/chat/chat-widget.tsx` — remove setState-in-effect

- Replace the mount `useEffect` that loads history with a lazy state initializer: `useState<Message[]>(() => loadChatHistory(productId))`. The widget remounts per product-page navigation, so lazy init is correct and the effect (and its lint error) is removed.
- Keep all other behavior identical (history persistence, 24h expiry, clear conversation).

### 4. AdSense placeholder handling

- `lib/ads/env.ts`: `adsenseConfigured()` must return `false` when `AD_CLIENT_ID` is empty OR matches a known placeholder (`ca-pub-1234567890123456`, `ca-pub-0000000000000000`). Add a small `PLACEHOLDER_CLIENT_IDS` set.
- Add a `isPlaceholderSlot(slot)` helper that returns `true` for the known placeholder slot ids (`1234567890`…`1234567893` and any all-zero 10-digit id).
- `components/ads/ad-slot.tsx`: `AdSlot` renders nothing when the slot is a placeholder even if the client looks configured (belt-and-suspenders).
- `app/layout.tsx`: no change needed — it already guards on `adsenseConfigured()`.

### 5. `lib/stripe/plans.ts` — Free plan copy

- Replace the Free plan feature `{ label: "5 detailed trust analyses per month", included: true }` with copy that reflects real behavior, e.g. `{ label: "Full analyses & red-flag reports for Pro", included: false }` (free users get trust scores and the trust meter on every product). Keep the rest of the Free plan (and all other plans) unchanged.

### 6. New `POST /api/admin/products` — manual product add

- Route: `app/api/admin/products/route.ts`, `export const dynamic = "force-dynamic"`.
- Auth: require `x-nicerella-admin-secret` via `isAdminRequest` (AGENTS.md §15); `401` otherwise.
- Rate limit: `guardRateLimit(request, { limit: 20, windowMs: 60_000 })`.
- Request body:
  ```jsonc
  {
    "products": [
      {
        "title": "Product title",
        "original_url": "https://...",
        "canonical_url": "https://... (optional, defaults to original_url)",
        "image_url": "https://...",
        "price": 49.99, // optional number
        "category": "electronics", // optional
        "source_id": "uuid", // optional — else resolved by source_name below
        "source_name": "Manual", // optional, only used when source_id absent
        "reviews": [
          { "rating": 5, "text": "review text", "date": "2026-08-01", "verified_purchase": true }
        ] // optional
      }
    ],
    "analyze": true // optional, default true
  }
  ```
- Validation per product:
  - `title` non-empty, trimmed.
  - `original_url` valid absolute http(s) URL.
  - `image_url` valid absolute http(s) URL (required — the product content gate, AGENTS.md §13).
  - `price` numeric and ≥ 0 when present.
  - `reviews[].rating` numeric 1–5; `reviews[].text` non-empty; `date` parseable ISO timestamp when present.
- Source resolution:
  - If `source_id` provided: verify it exists via `getSourceById`; else `400`.
  - Else resolve by `source_name` (default `"Manual"`): `listSources()` → match by name; if missing, `upsertSource({ name, listing_url: "manual://<slug-of-name>", active: false, parser_strategy: "manual" })` so it is never scraped. If the resolved/matched source is active, leave it active (it's the owner's choice); never change an existing source's active flag.
- Insert products append-only via `insertProducts` (dedupe by `original_url`). Use `findExistingUrls` first to report `skipped_duplicates`.
- Insert reviews via `insertReviews` only for newly inserted product ids (append-only, dedupe by `product_id, review_identifier`; for manual reviews, generate a stable `review_identifier` from `sha256(text+rating+date)` when the caller does not supply one, so re-posted identical reviews don't duplicate).
- Analysis: if `analyze !== false`, call `runAnalysisPipeline()` (bounded, picks up new pending products). Log `analyze: true` result summary.
- After analysis, `revalidateTag(PRODUCTS_CACHE_TAG, "max")` so new analyzed products appear immediately.
- Response summary:
  ```jsonc
  {
    "status": "ok",
    "requested": n,
    "inserted": n,
    "skipped_duplicates": n,
    "reviews_inserted": n,
    "products_without_reviews": n, // inserted but awaiting reviews/analysis
    "analyze": { "products_pending": n, "products_analyzed": n, "products_failed": n, "products_skipped_no_reviews": n },
    "errors": ["..."]
  }
  ```
- Per-product errors (validation) are collected in `errors` and do not abort the batch. Any hard failure (Supabase down) → `500` with a logged error via `writeLog`.

## Security requirements

- Admin secret header required; never accept the secret in the URL or body.
- Rate-limited (20/min) to bound abuse.
- Validate all URLs (http/https only) to prevent `javascript:` / protocol-relative injection.
- Sanitize review text minimally (trim; strip control chars). No HTML rendering of user-supplied text anywhere.
- Do not expose the route or its data to browser code — server-only route, admin-secret protected.
- Do not create active sources; manual sources are `active: false` so the scrape pipeline ignores them.

## Acceptance criteria

- `npx tsc --noEmit` passes with **zero** errors.
- `npm run lint` passes with **zero** errors and **zero** warnings.
- The AI chat widget still works end-to-end (open → send → AI reply using product context) on a product detail page, verified via playwright-mcp.
- The chat widget still loads saved history from localStorage on mount (lazy initializer) and still enforces the 24h expiry.
- With `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-1234567890123456` (the placeholder), `adsenseConfigured()` is `false`, no ad script tag is rendered, and no `ins.adsbygoogle` unit is rendered.
- With a real-looking client id, ad slots render as before.
- The pricing page Free plan no longer claims "5 detailed trust analyses per month".
- `POST /api/admin/products` inserts new products + their reviews, skips duplicates, triggers analysis on review-bearing products, and returns the summary object. Duplicate re-post returns `inserted: 0` and `skipped_duplicates: n`.
- No new console errors on home / product / pricing routes during verification.

## Checks to run

1. `npx tsc --noEmit`
2. `npm run lint`
3. Dev server smoke test of home, a product detail page, and `/pricing`.
4. playwright-mcp: product page → chat widget open/send/history; home → ad slot area renders nothing (no `ins.adsbygoogle`) with placeholder env.
5. Admin route curl test (with `x-nicerella-admin-secret`) posting a small product batch with reviews; re-post same batch to confirm dedupe.

## Exact manual test steps expected after implementation

1. Start dev server: `npm run dev`.
2. **Typecheck + lint:** run `npx tsc --noEmit` and `npm run lint` — both must be clean.
3. **Chat widget:** open a product page (e.g. from the homepage grid), click the chat bubble, ask a question, confirm the AI reply references the product's trust data; reload the page and confirm history persists; click "Clear conversation".
4. **AdSense placeholder:** with the current placeholder env values, view the homepage and product page source — confirm there is **no** `pagead2.googlesyndication.com` script tag and no `ins.adsbygoogle` element. (The previous console 400 from the placeholder should be gone.)
5. **Pricing page:** confirm the Free plan card no longer lists "5 detailed trust analyses per month".
6. **Manual product add (owner runs this on their machine with the admin secret):**
   ```bash
   curl -X POST http://localhost:3000/api/admin/products \
     -H "Content-Type: application/json" \
     -H "x-nicerella-admin-secret: $NICERELLA_ADMIN_SECRET" \
     -d '{"products":[{"title":"Test Manual Product","original_url":"https://example.com/p/1","image_url":"https://picsum.photos/seed/a/600","price":29.99,"category":"home","source_name":"Manual","reviews":[{"rating":5,"text":"Solid quality, worth every rupee.","date":"2026-08-01"},{"rating":4,"text":"Good but shipping was slow."}]}],"analyze":true}'
   ```
   Expect `inserted: 1`, `reviews_inserted: 2`, and after a moment `analyze.products_analyzed: 1`. Re-run the exact same curl → expect `inserted: 0`, `skipped_duplicates: 1`.
7. Watch the dev-server terminal for pipeline logs (insert/review/analysis progress) per AGENTS.md §17.
8. Playwright MCP verification flow (AGENTS.md §21): navigate home → product detail → pricing; interact with the chat; report console + network status.
